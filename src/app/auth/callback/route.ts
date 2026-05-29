import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications/send";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role;

      if (user && role === "student") {
        const inviteCode = user.user_metadata?.invite_code;
        if (inviteCode) {
          await linkStudentToInstructor(supabase, user.id, inviteCode);
        }
      }

      const redirectTo =
        role === "instructor"
          ? "/instructor/dashboard"
          : role === "student"
            ? "/student/dashboard"
            : next;

      // Send welcome notification (best-effort)
      if (user) {
        const inviteCode = role === "student" ? user.user_metadata?.invite_code : undefined;
        const instructorName = inviteCode
          ? await getInstructorName(supabase, inviteCode)
          : undefined;
        sendNotification({
          recipientUserId: user.id,
          recipientEmail: user.email ?? undefined,
          event: "welcome",
          data: {
            studentName: user.user_metadata?.full_name,
            instructorName,
          },
        }).catch(() => {});
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

async function getInstructorName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  inviteCode: string,
): Promise<string | undefined> {
  const { data } = await supabase
    .from("instructor_settings")
    .select("instructor_id")
    .eq("invite_code", inviteCode.trim().toUpperCase())
    .single();
  if (!data) return undefined;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", data.instructor_id)
    .single();
  return profile?.full_name ?? undefined;
}

async function linkStudentToInstructor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  inviteCode: string
) {
  const { data: settings } = await supabase
    .from("instructor_settings")
    .select("instructor_id")
    .eq("invite_code", inviteCode.trim().toUpperCase())
    .single();

  if (!settings) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", userId)
    .single();

  if (!profile) return;

  const { data: existing } = await supabase
    .from("students")
    .select("id")
    .eq("instructor_id", settings.instructor_id)
    .eq("profile_id", userId)
    .single();

  if (existing) return;

  const { data: user } = await supabase.auth.getUser();
  const email = user?.user?.email;

  if (email) {
    const { data: preAdded } = await supabase
      .from("students")
      .select("id")
      .eq("instructor_id", settings.instructor_id)
      .eq("email", email)
      .is("profile_id", null)
      .single();

    if (preAdded) {
      await supabase
        .from("students")
        .update({ profile_id: userId })
        .eq("id", preAdded.id);
      return;
    }
  }

  await supabase.from("students").insert({
    instructor_id: settings.instructor_id,
    profile_id: userId,
    full_name: profile.full_name,
    email: email ?? null,
    phone: profile.phone ?? null,
  });
}
