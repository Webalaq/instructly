"use server";

import { revalidatePath } from "next/cache";
import { format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { lessonRequestSchema, rescheduleRequestSchema } from "@/lib/schemas/lesson-request";
import { computeAvailableSlots } from "@/lib/availability";
import { sendNotification } from "@/lib/notifications/send";

function getServiceRole() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getStudentContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: studentRecord } = await supabase
    .from("students")
    .select("id, instructor_id")
    .eq("profile_id", user.id)
    .single();

  return studentRecord ? { supabase, user, student: studentRecord } : null;
}

async function validateSlotAvailable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  instructorId: string,
  startAt: string,
  endAt: string,
  excludeBookingId?: string,
) {
  const [{ data: availSlots }, { data: bookings }] = await Promise.all([
    supabase
      .from("availability_slots")
      .select("day_of_week, start_time, end_time, type, date")
      .eq("instructor_id", instructorId),
    supabase
      .from("bookings")
      .select("id, start_at, end_at")
      .eq("instructor_id", instructorId)
      .eq("status", "scheduled"),
  ]);

  const recurring = (availSlots ?? []).filter((s) => s.type === "recurring").map((s) => ({
    day_of_week: s.day_of_week!,
    start_time: s.start_time!,
    end_time: s.end_time!,
  }));
  const blocked = (availSlots ?? []).filter((s) => s.type === "blocked").map((s) => s.date!);
  const existingBookings = (bookings ?? [])
    .filter((b) => b.id !== excludeBookingId)
    .map((b) => ({ start_at: b.start_at, end_at: b.end_at }));

  const dateStr = startAt.slice(0, 10);
  const durationMs = new Date(endAt).getTime() - new Date(startAt).getTime();
  const durationMinutes = durationMs / 60000;

  const available = computeAvailableSlots({
    recurring,
    blocked,
    bookings: existingBookings,
    startDate: dateStr,
    endDate: dateStr,
    durationMinutes,
  });

  return available.some((s) => s.start === startAt && s.end === endAt);
}

export async function submitLessonRequest(data: unknown) {
  const parsed = lessonRequestSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const ctx = await getStudentContext();
  if (!ctx) return { error: "Not authenticated or not linked to instructor" };

  const isValid = await validateSlotAvailable(
    ctx.supabase,
    ctx.student.instructor_id,
    parsed.data.proposedStartAt,
    parsed.data.proposedEndAt,
  );

  if (!isValid) {
    return { error: "This time slot is no longer available. Please choose another." };
  }

  const startDate = new Date(parsed.data.proposedStartAt);

  const { error } = await ctx.supabase.from("lesson_requests").insert({
    student_id: ctx.student.id,
    instructor_id: ctx.student.instructor_id,
    preferred_date: parsed.data.proposedStartAt.slice(0, 10),
    preferred_time: `${startDate.getUTCHours().toString().padStart(2, "0")}:${startDate.getUTCMinutes().toString().padStart(2, "0")}`,
    duration_minutes: parsed.data.durationMinutes,
    message: parsed.data.message || null,
    type: "new",
    initiated_by: "student",
    proposed_start_at: parsed.data.proposedStartAt,
    proposed_end_at: parsed.data.proposedEndAt,
    status: "pending",
  });

  if (error) return { error: "Failed to submit request" };

  revalidatePath("/student/requests");
  revalidatePath("/instructor/requests");
  return { success: true };
}

export async function submitRescheduleRequest(data: unknown) {
  const parsed = rescheduleRequestSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const ctx = await getStudentContext();
  if (!ctx) return { error: "Not authenticated or not linked to instructor" };

  const { data: booking } = await ctx.supabase
    .from("bookings")
    .select("id, student_id, start_at")
    .eq("id", parsed.data.bookingId)
    .eq("status", "scheduled")
    .single();

  if (!booking || booking.student_id !== ctx.student.id) {
    return { error: "Booking not found" };
  }

  const isValid = await validateSlotAvailable(
    ctx.supabase,
    ctx.student.instructor_id,
    parsed.data.proposedStartAt,
    parsed.data.proposedEndAt,
    parsed.data.bookingId,
  );

  if (!isValid) {
    return { error: "This time slot is no longer available. Please choose another." };
  }

  const startDate = new Date(parsed.data.proposedStartAt);

  const { error } = await ctx.supabase.from("lesson_requests").insert({
    student_id: ctx.student.id,
    instructor_id: ctx.student.instructor_id,
    preferred_date: parsed.data.proposedStartAt.slice(0, 10),
    preferred_time: `${startDate.getUTCHours().toString().padStart(2, "0")}:${startDate.getUTCMinutes().toString().padStart(2, "0")}`,
    duration_minutes: parsed.data.durationMinutes,
    message: parsed.data.message || null,
    type: "reschedule",
    booking_id: parsed.data.bookingId,
    initiated_by: "student",
    proposed_start_at: parsed.data.proposedStartAt,
    proposed_end_at: parsed.data.proposedEndAt,
    status: "pending",
  });

  if (error) return { error: "Failed to submit reschedule request" };

  // Notify instructor of student-initiated reschedule request
  sendNotification({
    recipientUserId: ctx.student.instructor_id,
    event: "reschedule_request",
    data: {
      studentName: ctx.user.user_metadata?.full_name,
      oldDate: booking.start_at ? format(parseISO(booking.start_at), "EEEE d MMMM") : undefined,
      oldTime: booking.start_at ? format(parseISO(booking.start_at), "HH:mm") : undefined,
      newDate: format(new Date(parsed.data.proposedStartAt), "EEEE d MMMM"),
      newTime: format(new Date(parsed.data.proposedStartAt), "HH:mm"),
      actionUrl: "/instructor/requests",
    },
  }).catch(() => {});

  revalidatePath("/student/requests");
  revalidatePath("/student/lessons");
  revalidatePath("/instructor/requests");
  return { success: true };
}

export async function respondToReschedule(requestId: string, status: "accepted" | "declined") {
  const ctx = await getStudentContext();
  if (!ctx) return { error: "Not authenticated" };

  const { data: request } = await ctx.supabase
    .from("lesson_requests")
    .select("id, type, booking_id, proposed_start_at, proposed_end_at, student_id")
    .eq("id", requestId)
    .single();

  if (!request || request.student_id !== ctx.student.id) {
    return { error: "Request not found" };
  }

  const { error: updateError } = await ctx.supabase
    .from("lesson_requests")
    .update({ status })
    .eq("id", requestId);

  if (updateError) return { error: "Failed to update request" };

  // If accepting a reschedule, update the booking via service role
  // (student RLS doesn't allow updating booking times)
  if (status === "accepted" && request.type === "reschedule" && request.booking_id && request.proposed_start_at && request.proposed_end_at) {
    const service = getServiceRole();
    const { error: bookingError } = await service
      .from("bookings")
      .update({
        start_at: request.proposed_start_at,
        end_at: request.proposed_end_at,
      })
      .eq("id", request.booking_id);

    if (bookingError) {
      await ctx.supabase
        .from("lesson_requests")
        .update({ status: "pending" })
        .eq("id", requestId);
      return { error: "Failed to update booking time" };
    }
  }

  // Notify instructor of student's reschedule response
  sendNotification({
    recipientUserId: ctx.student.instructor_id,
    event: "reschedule_response",
    data: {
      studentName: ctx.user.user_metadata?.full_name,
      status,
      newDate: request.proposed_start_at
        ? format(parseISO(request.proposed_start_at), "EEEE d MMMM")
        : undefined,
      newTime:
        request.proposed_start_at && request.proposed_end_at
          ? format(parseISO(request.proposed_start_at), "HH:mm") +
            " – " +
            format(parseISO(request.proposed_end_at), "HH:mm")
          : undefined,
    },
  }).catch(() => {});

  revalidatePath("/student/requests");
  revalidatePath("/student/lessons");
  revalidatePath("/student/calendar");
  revalidatePath("/instructor/requests");
  revalidatePath("/instructor/bookings");
  return { success: true };
}
