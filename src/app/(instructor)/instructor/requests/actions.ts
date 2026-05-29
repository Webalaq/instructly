"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { rescheduleRequestSchema } from "@/lib/schemas/lesson-request";
import { computeAvailableSlots } from "@/lib/availability";

export async function respondToRequest(requestId: string, status: "accepted" | "declined") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch the request to check type
  const { data: request } = await supabase
    .from("lesson_requests")
    .select("*, students(instructor_id)")
    .eq("id", requestId)
    .eq("instructor_id", user.id)
    .single();

  if (!request) return { error: "Request not found" };

  // Update request status
  const { error: updateError } = await supabase
    .from("lesson_requests")
    .update({ status })
    .eq("id", requestId)
    .eq("instructor_id", user.id);

  if (updateError) return { error: "Failed to update request" };

  // If accepting a new lesson request, create a booking
  if (status === "accepted" && request.type === "new" && request.proposed_start_at && request.proposed_end_at) {
    const { data: settings } = await supabase
      .from("instructor_settings")
      .select("hourly_rate_pence")
      .eq("instructor_id", user.id)
      .single();

    const hourlyRate = settings?.hourly_rate_pence ?? 3500;
    const pricePence = Math.round((request.duration_minutes / 60) * hourlyRate);

    const { error: bookingError } = await supabase.from("bookings").insert({
      instructor_id: user.id,
      student_id: request.student_id,
      start_at: request.proposed_start_at,
      end_at: request.proposed_end_at,
      pickup_location: null,
      price_pence: pricePence,
      status: "scheduled",
    });

    if (bookingError) {
      await supabase
        .from("lesson_requests")
        .update({ status: "pending" })
        .eq("id", requestId);

      if (bookingError.code === "23P01") {
        return { error: "Time slot now has a conflict. Request reverted to pending." };
      }
      return { error: "Failed to create booking from request" };
    }
  }

  // If accepting a reschedule, update the existing booking
  if (status === "accepted" && request.type === "reschedule" && request.booking_id && request.proposed_start_at && request.proposed_end_at) {
    const { error: bookingError } = await supabase
      .from("bookings")
      .update({
        start_at: request.proposed_start_at,
        end_at: request.proposed_end_at,
      })
      .eq("id", request.booking_id);

    if (bookingError) {
      await supabase
        .from("lesson_requests")
        .update({ status: "pending" })
        .eq("id", requestId);

      if (bookingError.code === "23P01") {
        return { error: "New time slot has a conflict. Request reverted to pending." };
      }
      return { error: "Failed to reschedule booking" };
    }
  }

  revalidatePath("/instructor/requests");
  revalidatePath("/instructor/bookings");
  revalidatePath("/student/requests");
  revalidatePath("/student/lessons");
  revalidatePath("/student/calendar");
  return { success: true };
}

export async function submitInstructorReschedule(data: unknown) {
  const parsed = rescheduleRequestSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Verify booking belongs to this instructor
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, student_id, start_at")
    .eq("id", parsed.data.bookingId)
    .eq("instructor_id", user.id)
    .eq("status", "scheduled")
    .single();

  if (!booking) return { error: "Booking not found" };

  // Validate slot is available
  const [{ data: availSlots }, { data: existingBookings }] = await Promise.all([
    supabase
      .from("availability_slots")
      .select("day_of_week, start_time, end_time, type, date")
      .eq("instructor_id", user.id),
    supabase
      .from("bookings")
      .select("id, start_at, end_at")
      .eq("instructor_id", user.id)
      .eq("status", "scheduled"),
  ]);

  const recurring = (availSlots ?? []).filter((s) => s.type === "recurring").map((s) => ({
    day_of_week: s.day_of_week!,
    start_time: s.start_time!,
    end_time: s.end_time!,
  }));
  const blocked = (availSlots ?? []).filter((s) => s.type === "blocked").map((s) => s.date!);
  const bookingsForCheck = (existingBookings ?? [])
    .filter((b) => b.id !== parsed.data.bookingId)
    .map((b) => ({ start_at: b.start_at, end_at: b.end_at }));

  const dateStr = parsed.data.proposedStartAt.slice(0, 10);
  const available = computeAvailableSlots({
    recurring,
    blocked,
    bookings: bookingsForCheck,
    startDate: dateStr,
    endDate: dateStr,
    durationMinutes: parsed.data.durationMinutes,
  });

  const isValid = available.some(
    (s) => s.start === parsed.data.proposedStartAt && s.end === parsed.data.proposedEndAt,
  );

  if (!isValid) {
    return { error: "This time slot is not available." };
  }

  const startDate = new Date(parsed.data.proposedStartAt);

  const { error } = await supabase.from("lesson_requests").insert({
    student_id: booking.student_id,
    instructor_id: user.id,
    preferred_date: parsed.data.proposedStartAt.slice(0, 10),
    preferred_time: `${startDate.getUTCHours().toString().padStart(2, "0")}:${startDate.getUTCMinutes().toString().padStart(2, "0")}`,
    duration_minutes: parsed.data.durationMinutes,
    message: parsed.data.message || null,
    type: "reschedule",
    booking_id: parsed.data.bookingId,
    initiated_by: "instructor",
    proposed_start_at: parsed.data.proposedStartAt,
    proposed_end_at: parsed.data.proposedEndAt,
    status: "pending",
  });

  if (error) return { error: "Failed to submit reschedule request" };

  revalidatePath("/instructor/requests");
  revalidatePath("/instructor/bookings");
  revalidatePath("/student/requests");
  return { success: true };
}
