"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/schemas/profile";

export async function updateProfile(data: unknown) {
  const parsed = updateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Update profile
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
    })
    .eq("id", user.id);

  if (profileError) return { error: "Failed to update profile" };

  // Update user metadata
  await supabase.auth.updateUser({
    data: { full_name: parsed.data.fullName },
  });

  // Update instructor settings if rate/duration/business name changed
  if (parsed.data.hourlyRatePounds || parsed.data.defaultLessonMinutes || parsed.data.businessName !== undefined) {
    const updates: Record<string, unknown> = {};
    if (parsed.data.hourlyRatePounds) {
      updates.hourly_rate_pence = parsed.data.hourlyRatePounds * 100;
    }
    if (parsed.data.defaultLessonMinutes) {
      updates.default_lesson_minutes = parsed.data.defaultLessonMinutes;
    }
    if (parsed.data.businessName !== undefined) {
      updates.business_name = parsed.data.businessName || null;
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from("instructor_settings")
        .update(updates)
        .eq("instructor_id", user.id);
    }
  }

  revalidatePath("/instructor/profile");
  revalidatePath("/instructor/dashboard");
  return { success: true };
}
