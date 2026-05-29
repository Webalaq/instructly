"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function getServiceRole() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (key) return createServiceClient(url, key);
  return null;
}

export async function linkStudentToInstructor(inviteCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Use service role to bypass RLS (student can't read unlinked rows)
  const service = getServiceRole();
  if (!service) {
    // Fallback: add RLS policy to allow reading by email match
    // For now, try with user client
    return await linkWithUserClient(supabase, user);
  }

  const code = inviteCode.trim().toUpperCase();

  const { data: settings } = await service
    .from("instructor_settings")
    .select("instructor_id")
    .eq("invite_code", code)
    .single();

  if (!settings) return { error: "Invalid invite code" };

  // Already linked?
  const { data: existing } = await service
    .from("students")
    .select("id")
    .eq("instructor_id", settings.instructor_id)
    .eq("profile_id", user.id)
    .single();

  if (existing) return { success: true };

  // Pre-added by email?
  const { data: preAdded } = await service
    .from("students")
    .select("id")
    .eq("instructor_id", settings.instructor_id)
    .eq("email", user.email)
    .is("profile_id", null)
    .single();

  if (preAdded) {
    await service.from("students").update({ profile_id: user.id }).eq("id", preAdded.id);
    return { success: true };
  }

  // Create new record
  await service.from("students").insert({
    instructor_id: settings.instructor_id,
    profile_id: user.id,
    full_name: user.user_metadata?.full_name ?? user.email ?? "Student",
    email: user.email ?? null,
  });

  return { success: true };
}

async function linkWithUserClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  const code = ((user.user_metadata?.invite_code as string) ?? "").trim().toUpperCase();
  if (!code) return { error: "No invite code" };

  const { data: settings } = await supabase
    .from("instructor_settings")
    .select("instructor_id")
    .eq("invite_code", code)
    .single();

  if (!settings) return { error: "Invalid invite code" };

  // Try insert (RLS allows student_insert_self)
  await supabase.from("students").insert({
    instructor_id: settings.instructor_id,
    profile_id: user.id,
    full_name: (user.user_metadata?.full_name as string) ?? user.email ?? "Student",
    email: user.email ?? null,
  });

  return { success: true };
}
