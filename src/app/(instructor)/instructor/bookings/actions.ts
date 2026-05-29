"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createBookingSchema, updateBookingSchema } from "@/lib/schemas/booking";
import { sendWhatsAppMessage } from "@/lib/twilio/send";
import { getPlanLimits } from "@/lib/stripe/plan-limits";

export async function createBooking(data: unknown) {
  const parsed = createBookingSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("bookings").insert({
    instructor_id: user.id,
    student_id: parsed.data.studentId,
    start_at: parsed.data.startAt,
    end_at: parsed.data.endAt,
    pickup_location: parsed.data.pickupLocation || null,
    price_pence: parsed.data.pricePence,
    status: "scheduled",
  });

  if (error) {
    if (error.code === "23P01") {
      return { error: "This time slot overlaps with an existing booking" };
    }
    return { error: "Failed to create booking" };
  }

  revalidatePath("/instructor/bookings");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/calendar");
  revalidatePath("/student/lessons");
  return { success: true };
}

export async function updateBooking(id: string, data: unknown) {
  const parsed = updateBookingSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("bookings")
    .update({
      student_id: parsed.data.studentId,
      start_at: parsed.data.startAt,
      end_at: parsed.data.endAt,
      pickup_location: parsed.data.pickupLocation || null,
      price_pence: parsed.data.pricePence,
      status: parsed.data.status,
      paid: parsed.data.paid ?? false,
      cancellation_reason: parsed.data.cancellationReason || null,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23P01") {
      return { error: "This time slot overlaps with an existing booking" };
    }
    return { error: "Failed to update booking" };
  }

  revalidatePath("/instructor/bookings");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/calendar");
  revalidatePath("/student/lessons");
  return { success: true };
}

export async function cancelBooking(id: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch booking details before cancelling (need student info for notification)
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, start_at, student_id, students(full_name, phone)")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancellation_reason: reason || null,
    })
    .eq("id", id);

  if (error) return { error: "Failed to cancel booking" };

  // Send WhatsApp cancellation notification (Premium plan only, best-effort)
  if (booking) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("instructor_id", user.id)
      .single();
    const limits = getPlanLimits(sub?.plan);
    const student = Array.isArray(booking.students) ? booking.students[0] : booking.students;
    if (student?.phone && limits.whatsappAutomation) {
      sendWhatsAppMessage({
        bookingId: booking.id,
        recipientPhone: student.phone,
        templateKey: "cancellation",
        studentName: student.full_name,
        instructorName: user.user_metadata?.full_name ?? "your instructor",
        startAt: booking.start_at,
      }).catch(() => {});
    }
  }

  revalidatePath("/instructor/bookings");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/calendar");
  revalidatePath("/student/lessons");
  return { success: true };
}

export async function completeBooking(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("bookings")
    .update({ status: "completed" })
    .eq("id", id);

  if (error) return { error: "Failed to complete booking" };

  revalidatePath("/instructor/bookings");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/calendar");
  revalidatePath("/student/lessons");
  return { success: true };
}
