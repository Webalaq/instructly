import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/lib/schemas/student";
import StudentTable from "./StudentTable";

const SOFT_LIMIT = 20;

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "instructor") {
    redirect("/login");
  }

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });

  const typedStudents = (students ?? []) as Student[];
  const activeCount = typedStudents.filter((s) => s.status === "active").length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Students</h1>
        <p className="text-muted-foreground">
          Manage your learners and track their progress.
        </p>
      </div>

      {activeCount >= SOFT_LIMIT && (
        <div className="mb-6 rounded-md border border-yellow-500/50 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          You have {activeCount} active students. Basic plan supports up to {SOFT_LIMIT}.
        </div>
      )}

      <StudentTable students={typedStudents} />
    </main>
  );
}
