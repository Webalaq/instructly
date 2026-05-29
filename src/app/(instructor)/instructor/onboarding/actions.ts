"use server";

import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/schemas/onboarding";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function completeOnboarding(data: unknown) {
  const parsed = onboardingSchema.safeParse(data);
  if (!parsed.success) {
    return {
      error: "Invalid data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: existing } = await supabase
    .from("instructor_settings")
    .select("instructor_id")
    .eq("instructor_id", user.id)
    .single();

  if (existing) {
    return { error: "Already onboarded" };
  }

  const inviteCode = generateInviteCode();

  const { error: insertError } = await supabase
    .from("instructor_settings")
    .insert({
      instructor_id: user.id,
      hourly_rate_pence: Math.round(parsed.data.hourlyRatePounds * 100),
      default_lesson_minutes: parsed.data.defaultLessonMinutes,
      working_hours: parsed.data.workingHours,
      postcodes: parsed.data.postcodes,
      business_name: parsed.data.businessName || null,
      invite_code: inviteCode,
    });

  if (insertError) {
    console.error("Onboarding insert error:", insertError.code, insertError.message, insertError.details);
    if (
      insertError.code === "23505" &&
      insertError.message.includes("invite_code")
    ) {
      const retryCode = generateInviteCode();
      const { error: retryError } = await supabase
        .from("instructor_settings")
        .insert({
          instructor_id: user.id,
          hourly_rate_pence: Math.round(parsed.data.hourlyRatePounds * 100),
          default_lesson_minutes: parsed.data.defaultLessonMinutes,
          working_hours: parsed.data.workingHours,
          postcodes: parsed.data.postcodes,
          business_name: parsed.data.businessName || null,
          invite_code: retryCode,
        });

      if (retryError) {
        return { error: "Failed to save settings. Please try again." };
      }
      return { success: true, inviteCode: retryCode };
    }

    return { error: "Failed to save settings. Please try again." };
  }

  return { success: true, inviteCode };
}
