import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentProfileForm from "./StudentProfileForm";

export default async function StudentProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "student") redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  const { data: studentRecord } = await supabase
    .from("students")
    .select("id, status, theory_passed, test_date, instructor_id")
    .eq("profile_id", user.id)
    .single();

  let instructorName: string | null = null;
  if (studentRecord) {
    const { data: instructor } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", studentRecord.instructor_id)
      .single();
    instructorName = instructor?.full_name ?? null;
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold md:text-2xl">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account details.</p>
      </div>

      <div className="max-w-lg space-y-6">
        <StudentProfileForm
          initialValues={{
            fullName: profile?.full_name ?? "",
            phone: profile?.phone ?? "",
          }}
          email={user.email ?? ""}
        />

        {/* Account info */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="font-semibold">Account info</h3>
          {studentRecord && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{studentRecord.status.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Theory passed</span>
                <span className="font-medium">{studentRecord.theory_passed ? "Yes" : "No"}</span>
              </div>
              {studentRecord.test_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Test date</span>
                  <span className="font-medium">{studentRecord.test_date}</span>
                </div>
              )}
              {instructorName && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Instructor</span>
                  <span className="font-medium">{instructorName}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
