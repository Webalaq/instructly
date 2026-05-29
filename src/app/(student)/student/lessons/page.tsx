import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LessonCard from "./LessonCard";

type LessonRow = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  pickup_location: string | null;
  price_pence: number;
  paid: boolean;
  cancellation_reason: string | null;
  lesson_notes: {
    summary: string;
    homework: string | null;
    student_feedback: string | null;
  }[];
};

export default async function StudentLessonsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "student") redirect("/login");

  const { data: studentRecord } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!studentRecord) {
    return (
      <div className="px-4 py-6 md:px-8">
        <h1 className="text-xl font-bold">Lessons</h1>
        <p className="mt-4 text-muted-foreground">Link to an instructor first.</p>
      </div>
    );
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, start_at, end_at, status, pickup_location, price_pence, paid, cancellation_reason, lesson_notes(summary, homework, student_feedback)")
    .eq("student_id", studentRecord.id)
    .order("start_at", { ascending: false });

  const lessons = (bookings ?? []) as LessonRow[];
  const upcoming = lessons.filter((l) => l.status === "scheduled" && new Date(l.start_at) >= new Date());
  const past = lessons.filter((l) => l.status !== "scheduled" || new Date(l.start_at) < new Date());

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold md:text-2xl">My Lessons</h1>
        <p className="text-sm text-muted-foreground">View your lesson history and upcoming schedule.</p>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-3">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} canCancel />
            ))}
          </div>
        </div>
      )}

      {/* Past lessons */}
      <div>
        <h2 className="text-base font-semibold mb-3">
          {upcoming.length > 0 ? "Past lessons" : "All lessons"}
        </h2>
        {past.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
            No lessons yet. Your instructor will book your first lesson.
          </div>
        ) : (
          <div className="space-y-3">
            {past.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} canCancel={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
