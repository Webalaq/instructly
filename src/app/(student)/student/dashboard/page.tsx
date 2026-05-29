import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import {
  CalendarIcon,
  BarChart3Icon,
  BookOpenIcon,
  UserIcon,
  MapPinIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SKILL_LABELS, type SkillKey } from "@/lib/schemas/lesson-notes";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "student") {
    redirect("/login");
  }

  // Find student record
  let { data: studentRecord } = await supabase
    .from("students")
    .select("id, instructor_id, full_name, status, theory_passed, test_date")
    .eq("profile_id", user.id)
    .single();

  // Fallback: try auto-link if invite_code exists but student not linked yet
  if (!studentRecord && user.user_metadata?.invite_code) {
    const { linkStudentToInstructor } = await import("@/app/(auth)/actions");
    await linkStudentToInstructor(user.user_metadata.invite_code as string);

    // Re-fetch
    const res = await supabase
      .from("students")
      .select("id, instructor_id, full_name, status, theory_passed, test_date")
      .eq("profile_id", user.id)
      .single();
    studentRecord = res.data;
  }

  if (!studentRecord) {
    return (
      <div className="px-4 py-6 md:px-8">
        <h1 className="text-xl font-bold">Welcome to Instructly</h1>
        <div className="mt-6 rounded-xl border border-dashed bg-card p-8 text-center">
          <UserIcon className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Not linked to an instructor yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Ask your driving instructor for their invite code, then sign up with that code to get connected.
          </p>
        </div>
      </div>
    );
  }

  // Get instructor info
  const { data: instructor } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", studentRecord.instructor_id)
    .single();

  const { data: instructorSettings } = await supabase
    .from("instructor_settings")
    .select("business_name, hourly_rate_pence")
    .eq("instructor_id", studentRecord.instructor_id)
    .single();

  // Next upcoming lesson
  const { data: nextBookings } = await supabase
    .from("bookings")
    .select("id, start_at, end_at, pickup_location, price_pence")
    .eq("student_id", studentRecord.id)
    .eq("status", "scheduled")
    .gte("start_at", new Date().toISOString())
    .order("start_at")
    .limit(1);

  const nextLesson = nextBookings?.[0];

  // Total lessons completed
  const { count: completedCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentRecord.id)
    .eq("status", "completed");

  // Latest skill ratings
  const { data: latestRatings } = await supabase
    .from("skill_ratings")
    .select("skill_key, rating")
    .eq("student_id", studentRecord.id)
    .order("created_at", { ascending: false })
    .limit(12);

  const ratingMap = new Map<string, number>();
  for (const r of latestRatings ?? []) {
    if (!ratingMap.has(r.skill_key)) {
      ratingMap.set(r.skill_key, r.rating);
    }
  }
  const ratedSkills = ratingMap.size;
  const avgRating = ratedSkills > 0
    ? (Array.from(ratingMap.values()).reduce((a, b) => a + b, 0) / ratedSkills).toFixed(1)
    : null;

  const firstName = user.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-xl font-bold md:text-2xl">Hi {firstName}</h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE d MMMM yyyy")}
        </p>
      </div>

      {/* Welcome banner for new students */}
      {(completedCount ?? 0) === 0 && !nextLesson && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-6">
          <h2 className="text-lg font-semibold">Welcome to Instructly!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;re connected with <span className="font-medium text-foreground">{instructor?.full_name ?? "your instructor"}</span>.
            They&apos;ll schedule your lessons and you&apos;ll see everything here — upcoming lessons, progress, and notes.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
            <div className="rounded-lg border bg-card p-3">
              <CalendarIcon className="mx-auto size-5 text-primary" />
              <div className="mt-1 font-medium text-foreground">Calendar</div>
              <div>See your schedule</div>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <BarChart3Icon className="mx-auto size-5 text-primary" />
              <div className="mt-1 font-medium text-foreground">Progress</div>
              <div>Track your skills</div>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <BookOpenIcon className="mx-auto size-5 text-primary" />
              <div className="mt-1 font-medium text-foreground">Lessons</div>
              <div>View notes</div>
            </div>
          </div>
        </div>
      )}

      {/* Next lesson card */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="bg-primary/5 px-4 py-3 text-sm font-medium flex items-center gap-2">
          <CalendarIcon className="size-4 text-primary" />
          Next lesson
        </div>
        {nextLesson ? (
          <div className="p-4">
            <div className="text-lg font-semibold">
              {format(parseISO(nextLesson.start_at), "EEEE d MMMM")}
            </div>
            <div className="mt-1 text-2xl font-bold text-primary">
              {format(parseISO(nextLesson.start_at), "HH:mm")} – {format(parseISO(nextLesson.end_at), "HH:mm")}
            </div>
            {nextLesson.pickup_location && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPinIcon className="size-4" />
                {nextLesson.pickup_location}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            <p className="text-sm">No upcoming lessons booked</p>
            <p className="mt-1 text-xs">Contact your instructor to schedule</p>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold">{completedCount ?? 0}</div>
          <div className="text-xs text-muted-foreground">Lessons done</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold">{avgRating ?? "—"}</div>
          <div className="text-xs text-muted-foreground">Avg rating</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold">{ratedSkills}/12</div>
          <div className="text-xs text-muted-foreground">Skills rated</div>
        </div>
      </div>

      {/* Top skills */}
      {ratedSkills > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <BarChart3Icon className="size-4 text-primary" />
              Your skills
            </h2>
            <Link href="/student/progress" className="text-sm text-primary font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {Array.from(ratingMap.entries()).slice(0, 5).map(([key, rating]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
                <span className="text-sm">{SKILL_LABELS[key as SkillKey] ?? key}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${(rating / 5) * 100}%` }}
                    />
                  </div>
                  <span className="w-5 text-right text-sm font-semibold">{rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructor info */}
      <div className="mt-6 rounded-xl border bg-card p-4">
        <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
          <UserIcon className="size-4 text-primary" />
          Your instructor
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg shrink-0">
            {instructor?.full_name?.[0] ?? "?"}
          </div>
          <div>
            <div className="font-medium">{instructor?.full_name ?? "Unknown"}</div>
            {instructorSettings?.business_name && (
              <div className="text-sm text-muted-foreground">{instructorSettings.business_name}</div>
            )}
            {instructor?.phone && (
              <a href={`tel:${instructor.phone}`} className="text-sm text-primary">
                {instructor.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Test info */}
      {(studentRecord.theory_passed || studentRecord.test_date) && (
        <div className="mt-4 rounded-xl border bg-card p-4">
          <div className="flex flex-wrap gap-4">
            {studentRecord.theory_passed && (
              <Badge variant="default">Theory passed</Badge>
            )}
            {studentRecord.test_date && (
              <div className="text-sm">
                <span className="text-muted-foreground">Test date: </span>
                <span className="font-medium">{format(parseISO(studentRecord.test_date), "d MMM yyyy")}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick nav */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link href="/student/progress" className={buttonVariants({ variant: "outline", className: "h-auto py-4 flex-col gap-1" })}>
          <BarChart3Icon className="size-5" />
          <span className="text-sm">Progress</span>
        </Link>
        <Link href="/student/lessons" className={buttonVariants({ variant: "outline", className: "h-auto py-4 flex-col gap-1" })}>
          <BookOpenIcon className="size-5" />
          <span className="text-sm">Lessons</span>
        </Link>
      </div>
    </div>
  );
}
