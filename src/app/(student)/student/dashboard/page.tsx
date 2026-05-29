import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { PushSubscriptionBanner } from "@/components/PushSubscriptionBanner";
import {
  CalendarIcon,
  BarChart3Icon,
  BookOpenIcon,
  UserIcon,
  MapPinIcon,
  ChevronRightIcon,
  ClockIcon,
  SendIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SKILL_LABELS, type SkillKey } from "@/lib/schemas/lesson-notes";

function MiniSparkline({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 50 20" className="size-10" fill="none">
      <path
        d="M0 18 Q8 16 12 12 T24 8 T36 4 T50 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "student") {
    redirect("/login");
  }

  let { data: studentRecord } = await supabase
    .from("students")
    .select("id, instructor_id, full_name, status, theory_passed, test_date")
    .eq("profile_id", user.id)
    .single();

  if (!studentRecord && user.user_metadata?.invite_code) {
    const { linkStudentToInstructor } = await import("@/app/(auth)/actions");
    await linkStudentToInstructor(user.user_metadata.invite_code as string);

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

  const { data: nextBookings } = await supabase
    .from("bookings")
    .select("id, start_at, end_at, pickup_location, price_pence")
    .eq("student_id", studentRecord.id)
    .eq("status", "scheduled")
    .gte("start_at", new Date().toISOString())
    .order("start_at")
    .limit(1);

  const nextLesson = nextBookings?.[0];

  const { count: completedCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentRecord.id)
    .eq("status", "completed");

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

  const now = new Date();
  const firstName = user.user_metadata?.full_name?.split(" ")[0] || "there";

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-xl font-bold md:text-2xl">
          Good {now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening"}, {firstName}!
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(now, "EEEE, d MMMM yyyy")}
        </p>
      </div>

      <PushSubscriptionBanner />

      {/* Welcome banner for new students */}
      {(completedCount ?? 0) === 0 && !nextLesson && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-6">
          <h2 className="text-lg font-semibold">Welcome to Instructly!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;re connected with <span className="font-medium text-foreground">{instructor?.full_name ?? "your instructor"}</span>.
            They&apos;ll schedule your lessons and you&apos;ll see everything here.
          </p>
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
            <p className="mt-1 text-xs">Request a lesson or contact your instructor</p>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100">
              <ClockIcon className="size-3.5 text-amber-600" />
            </div>
            <MiniSparkline color="#d97706" />
          </div>
          <div className="mt-2 text-2xl font-bold">{completedCount ?? 0}</div>
          <div className="text-xs text-muted-foreground">Lessons done</div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="flex size-8 items-center justify-center rounded-lg bg-green-100">
              <BarChart3Icon className="size-3.5 text-green-600" />
            </div>
            <MiniSparkline color="#16a34a" />
          </div>
          <div className="mt-2 text-2xl font-bold">{avgRating ?? "—"}</div>
          <div className="text-xs text-muted-foreground">Avg rating</div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100">
              <BookOpenIcon className="size-3.5 text-blue-600" />
            </div>
            <MiniSparkline color="#2563eb" />
          </div>
          <div className="mt-2 text-2xl font-bold">{ratedSkills}/12</div>
          <div className="text-xs text-muted-foreground">Skills rated</div>
        </div>
      </div>

      {/* Top skills */}
      {ratedSkills > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Your skills</h2>
            <Link href="/student/progress" className="text-sm text-primary font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {Array.from(ratingMap.entries()).slice(0, 5).map(([key, rating]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
                <span className="text-sm">{SKILL_LABELS[key as SkillKey] ?? key}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-16 rounded-full bg-muted">
                    <div
                      className="h-2.5 rounded-full bg-primary transition-all"
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

      {/* Quick actions — list style */}
      <div className="mt-6">
        <h2 className="text-base font-semibold mb-3">Quick actions</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link href="/student/requests" className="flex items-center gap-4 rounded-xl border bg-card px-4 py-4 hover:bg-accent/50 active:scale-[0.98] transition-all">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 shrink-0">
              <SendIcon className="size-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Request Lesson</div>
              <div className="text-xs text-muted-foreground">Book available times</div>
            </div>
            <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
          </Link>

          <Link href="/student/calendar" className="flex items-center gap-4 rounded-xl border bg-card px-4 py-4 hover:bg-accent/50 active:scale-[0.98] transition-all">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 shrink-0">
              <CalendarIcon className="size-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Calendar</div>
              <div className="text-xs text-muted-foreground">View your schedule</div>
            </div>
            <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
          </Link>

          <Link href="/student/progress" className="flex items-center gap-4 rounded-xl border bg-card px-4 py-4 hover:bg-accent/50 active:scale-[0.98] transition-all">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 shrink-0">
              <BarChart3Icon className="size-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Progress</div>
              <div className="text-xs text-muted-foreground">Track your skills</div>
            </div>
            <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
          </Link>

          <Link href="/student/lessons" className="flex items-center gap-4 rounded-xl border bg-card px-4 py-4 hover:bg-accent/50 active:scale-[0.98] transition-all">
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
              <BookOpenIcon className="size-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Lessons</div>
              <div className="text-xs text-muted-foreground">View notes &amp; history</div>
            </div>
            <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
          </Link>
        </div>
      </div>

      {/* Instructor info */}
      <div className="mt-6 rounded-xl border bg-primary p-4 text-primary-foreground">
        <h2 className="text-sm font-semibold mb-3">Your instructor</h2>
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary-foreground/20 font-bold text-lg shrink-0">
            {instructor?.full_name?.[0] ?? "?"}
          </div>
          <div>
            <div className="font-medium">{instructor?.full_name ?? "Unknown"}</div>
            {instructorSettings?.business_name && (
              <div className="text-sm opacity-80">{instructorSettings.business_name}</div>
            )}
            {instructor?.phone && (
              <a href={`tel:${instructor.phone}`} className="text-sm opacity-80 underline">
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
    </div>
  );
}
