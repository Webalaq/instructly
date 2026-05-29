"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitLessonRequest(data: {
  preferredDate: string;
  preferredTime: string;
  durationMinutes: number;
  message: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: studentRecord } = await supabase
    .from("students")
    .select("id, instructor_id")
    .eq("profile_id", user.id)
    .single();

  if (!studentRecord) return { error: "Not linked to an instructor" };

  const { error } = await supabase.from("lesson_requests").insert({
    student_id: studentRecord.id,
    instructor_id: studentRecord.instructor_id,
    preferred_date: data.preferredDate,
    preferred_time: data.preferredTime,
    duration_minutes: data.durationMinutes,
    message: data.message || null,
    status: "pending",
  });

  if (error) return { error: "Failed to submit request" };

  revalidatePath("/student/requests");
  return { success: true };
}
