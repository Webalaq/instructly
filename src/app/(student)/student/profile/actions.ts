"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateStudentProfile(data: { fullName: string; phone: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.fullName,
      phone: data.phone || null,
    })
    .eq("id", user.id);

  if (error) return { error: "Failed to update profile" };

  await supabase.auth.updateUser({
    data: { full_name: data.fullName },
  });

  revalidatePath("/student/profile");
  revalidatePath("/student/dashboard");
  return { success: true };
}
