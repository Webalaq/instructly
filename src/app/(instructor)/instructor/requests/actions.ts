"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function respondToRequest(requestId: string, status: "accepted" | "declined") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("lesson_requests")
    .update({ status })
    .eq("id", requestId)
    .eq("instructor_id", user.id);

  if (error) return { error: "Failed to update request" };

  revalidatePath("/instructor/requests");
  revalidatePath("/student/requests");
  return { success: true };
}
