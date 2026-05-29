import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "instructor") {
    redirect("/login");
  }

  const [profileRes, settingsRes] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).single(),
    supabase.from("instructor_settings").select("business_name, hourly_rate_pence, default_lesson_minutes, invite_code, postcodes").eq("instructor_id", user.id).single(),
  ]);

  const profile = profileRes.data;
  const settings = settingsRes.data;

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold md:text-2xl">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal and business details.
        </p>
      </div>

      <div className="max-w-lg">
        <ProfileForm
          initialValues={{
            fullName: profile?.full_name ?? "",
            phone: profile?.phone ?? "",
            businessName: settings?.business_name ?? "",
            hourlyRatePounds: settings?.hourly_rate_pence ? settings.hourly_rate_pence / 100 : 40,
            defaultLessonMinutes: settings?.default_lesson_minutes ?? 60,
          }}
          email={user.email ?? ""}
          inviteCode={settings?.invite_code ?? ""}
          postcodes={settings?.postcodes ?? []}
        />
      </div>
    </div>
  );
}
