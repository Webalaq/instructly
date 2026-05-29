"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function cancelStudentBooking(bookingId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancellation_reason: reason || "Cancelled by student",
    })
    .eq("id", bookingId);

  if (error) return { error: "Failed to cancel booking" };

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
