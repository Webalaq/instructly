"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/twilio/send";
import { getPlanLimits } from "@/lib/stripe/plan-limits";

export async function cancelStudentBooking(bookingId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch booking details before cancelling (need instructor info for notification)
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, start_at, instructor_id")
    .eq("id", bookingId)
    .single();

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancellation_reason: reason || "Cancelled by student",
    })
    .eq("id", bookingId);

  if (error) return { error: "Failed to cancel booking" };

  // Send WhatsApp notification to instructor (Premium plan only, best-effort)
  if (booking) {
    const [{ data: instructor }, { data: sub }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", booking.instructor_id)
        .single(),
      supabase
        .from("subscriptions")
        .select("plan")
        .eq("instructor_id", booking.instructor_id)
        .single(),
    ]);
    const limits = getPlanLimits(sub?.plan);

    if (instructor?.phone && limits.whatsappAutomation) {
      sendWhatsAppMessage({
        bookingId: booking.id,
        recipientPhone: instructor.phone,
        templateKey: "cancellation",
        studentName: user.user_metadata?.full_name ?? "A student",
        instructorName: instructor.full_name ?? "Instructor",
        startAt: booking.start_at,
      }).catch(() => {});
    }
  }

  revalidatePath("/student/lessons");
  revalidatePath("/student/calendar");
  revalidatePath("/student/dashboard");
  return { success: true };
}

export async function submitStudentFeedback(bookingId: string, feedback: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("lesson_notes")
    .update({ student_feedback: feedback })
    .eq("booking_id", bookingId);

  if (error) return { error: "Failed to save feedback" };

  revalidatePath("/student/lessons");
  return { success: true };
}
