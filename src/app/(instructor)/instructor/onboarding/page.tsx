import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingWizard from "./OnboardingWizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "instructor") {
    redirect("/login");
  }

  const { data: settings } = await supabase
    .from("instructor_settings")
    .select("instructor_id")
    .eq("instructor_id", user.id)
    .single();

  if (settings) {
    redirect("/instructor/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <OnboardingWizard />
    </main>
  );
}
