"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { lessonNoteSchema } from "@/lib/schemas/lesson-notes";

export async function saveLessonNote(data: unknown) {
  const parsed = lessonNoteSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get booking to find student_id
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, student_id, instructor_id")
    .eq("id", parsed.data.bookingId)
    .single();

  if (!booking || booking.instructor_id !== user.id) {
    return { error: "Booking not found" };
  }

  // Upsert lesson note (one per booking)
  const { error: noteError } = await supabase
    .from("lesson_notes")
    .upsert(
      {
        booking_id: parsed.data.bookingId,
        summary: parsed.data.summary,
        homework: parsed.data.homework || null,
        instructor_private_notes: parsed.data.instructorPrivateNotes || null,
      },
      { onConflict: "booking_id" }
    );

  if (noteError) return { error: "Failed to save lesson note" };

  // Save skill ratings if provided
  if (parsed.data.ratings && parsed.data.ratings.length > 0) {
    // Delete existing ratings for this booking, then insert new ones
    await supabase
      .from("skill_ratings")
      .delete()
      .eq("booking_id", parsed.data.bookingId);

    const ratingsToInsert = parsed.data.ratings.map((r) => ({
      booking_id: parsed.data.bookingId,
      student_id: booking.student_id,
      skill_key: r.skillKey,
      rating: r.rating,
    }));

    const { error: ratingsError } = await supabase
      .from("skill_ratings")
      .insert(ratingsToInsert);

    if (ratingsError) return { error: "Failed to save skill ratings" };
  }

  revalidatePath("/instructor/bookings");
  revalidatePath("/student/lessons");
  revalidatePath("/student/progress");
  revalidatePath("/student/dashboard");
  return { success: true };
}

export async function getLessonNote(bookingId: string) {
  const supabase = await createClient();

  const [noteRes, ratingsRes] = await Promise.all([
    supabase
      .from("lesson_notes")
      .select("*")
      .eq("booking_id", bookingId)
      .single(),
    supabase
      .from("skill_ratings")
      .select("*")
      .eq("booking_id", bookingId),
  ]);

  return {
    note: noteRes.data,
    ratings: ratingsRes.data ?? [],
  };
}
