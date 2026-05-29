import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import {
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  BanknoteIcon,
  PlusIcon,
  ChevronRightIcon,
  TrendingUpIcon,
  UserIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const TZ = "Europe/London";

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

export default async function InstructorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "instructor") {
    redirect("/login");
  }

  const now = new Date();
  const todayStart = startOfDay(toZonedTime(now, TZ)).toISOString();
  const todayEnd = endOfDay(toZonedTime(now, TZ)).toISOString();

  const [studentsRes, todayBookingsRes, allBookingsRes, settingsRes, subRes] = await Promise.all([
    supabase
      .from("students")
      .select("id, status")
      .eq("instructor_id", user.id),
    supabase
      .from("bookings")
      .select("id, start_at, end_at, status, pickup_location, price_pence, students(full_name)")
      .eq("instructor_id", user.id)
      .eq("status", "scheduled")
      .gte("start_at", todayStart)
      .lte("start_at", todayEnd)
      .order("start_at"),
    supabase
      .from("bookings")
      .select("id, status, price_pence, paid")
      .eq("instructor_id", user.id),
    supabase
      .from("instructor_settings")
      .select("hourly_rate_pence, invite_code")
      .eq("instructor_id", user.id)
      .single(),
    supabase
      .from("subscriptions")
      .select("status, trial_ends_at")
      .eq("instructor_id", user.id)
      .single(),
  ]);

  const students = studentsRes.data ?? [];
  const todayBookings = todayBookingsRes.data ?? [];
  const allBookings = allBookingsRes.data ?? [];

  const activeStudents = students.filter((s) => s.status === "active").length;
  const totalStudents = students.length;
  const todayLessons = todayBookings.length;
  const completedTotal = allBookings.filter((b) => b.status === "completed").length;
  const todayEarnings = todayBookings.reduce((sum, b) => sum + (b.price_pence ?? 0), 0);

  const subscription = subRes.data;
  const isTrial = subscription?.status === "trialing";
  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - now.getTime()) / 86400000))
    : null;

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      {/* Greeting + trial badge */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">
            Good {now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening"}, {user.user_metadata?.full_name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(now, "EEEE, d MMMM yyyy")}
          </p>
        </div>
        {isTrial && (
          <div className="text-right shrink-0">
            <Badge className="bg-amber-400 text-primary hover:bg-amber-400 font-semibold text-xs">
              14-day free trial
            </Badge>
            {trialDaysLeft !== null && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Trial ends in {trialDaysLeft} days
              </p>
            )}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100">
              <CalendarIcon className="size-4 text-amber-600" />
            </div>
            <div className="flex items-center gap-1">
              <MiniSparkline color="#d97706" />
              <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50 font-semibold px-1.5">
                +100%
              </Badge>
            </div>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">Today</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{todayLessons}</span>
            <span className="text-xs text-muted-foreground">lesson{todayLessons !== 1 ? "s" : ""} scheduled</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-green-100">
              <UsersIcon className="size-4 text-green-600" />
            </div>
            <div className="flex items-center gap-1">
              <MiniSparkline color="#16a34a" />
              <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50 font-semibold px-1.5">
                +100%
              </Badge>
            </div>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">Students</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{activeStudents}</span>
            <span className="text-xs text-muted-foreground">{totalStudents} total students</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100">
              <ClockIcon className="size-4 text-blue-600" />
            </div>
            <div className="flex items-center gap-1">
              <MiniSparkline color="#2563eb" />
              <Badge variant="outline" className="text-[10px] text-muted-foreground border-border font-semibold px-1.5">
                0%
              </Badge>
            </div>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">Completed</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{completedTotal}</span>
            <span className="text-xs text-muted-foreground">lessons total</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-purple-100">
              <BanknoteIcon className="size-4 text-purple-600" />
            </div>
            <div className="flex items-center gap-1">
              <MiniSparkline color="#9333ea" />
              <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50 font-semibold px-1.5">
                +100%
              </Badge>
            </div>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">Today&apos;s earnings</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">£{(todayEarnings / 100).toFixed(0)}</span>
            <span className="text-xs text-muted-foreground">from {todayLessons} lesson{todayLessons !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Today's schedule */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Today&apos;s schedule</h2>
          <Link
            href="/instructor/bookings"
            className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
          >
            <PlusIcon className="size-4" />
            Add booking
          </Link>
        </div>

        {todayBookings.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-8 text-center">
            <CalendarIcon className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No lessons today</p>
            <Link
              href="/instructor/bookings"
              className={buttonVariants({ size: "sm", className: "mt-4" })}
            >
              Schedule a lesson
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {todayBookings.map((b) => {
              const student = Array.isArray(b.students) ? b.students[0] : b.students;
              return (
                <Link
                  key={b.id}
                  href="/instructor/bookings"
                  className="flex items-center gap-4 rounded-xl border bg-card p-4 active:scale-[0.98] transition-all"
                >
                  <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                    {student?.full_name?.[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{student?.full_name ?? "Unknown"}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(parseISO(b.start_at), "HH:mm")} – {format(parseISO(b.end_at), "HH:mm")}
                      {b.pickup_location && (
                        <span className="ml-2">· {b.pickup_location}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold">£{((b.price_pence ?? 0) / 100).toFixed(0)}</div>
                    <Badge variant="default" className="text-[10px]">
                      {b.status}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions — list style with descriptions and chevrons */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Quick actions</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link href="/instructor/students" className="flex items-center gap-4 rounded-xl border bg-card px-4 py-4 hover:bg-accent/50 active:scale-[0.98] transition-all">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 shrink-0">
              <UsersIcon className="size-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Students</div>
              <div className="text-xs text-muted-foreground">Manage your students</div>
            </div>
            <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
          </Link>

          <Link href="/instructor/bookings" className="flex items-center gap-4 rounded-xl border bg-card px-4 py-4 hover:bg-accent/50 active:scale-[0.98] transition-all">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 shrink-0">
              <CalendarIcon className="size-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Bookings</div>
              <div className="text-xs text-muted-foreground">View your schedule</div>
            </div>
            <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
          </Link>

          <Link href="/instructor/billing" className="flex items-center gap-4 rounded-xl border bg-card px-4 py-4 hover:bg-accent/50 active:scale-[0.98] transition-all">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 shrink-0">
              <BanknoteIcon className="size-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Billing</div>
              <div className="text-xs text-muted-foreground">Manage your plan</div>
            </div>
            <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
          </Link>

          <Link href="/instructor/profile" className="flex items-center gap-4 rounded-xl border bg-card px-4 py-4 hover:bg-accent/50 active:scale-[0.98] transition-all">
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100 shrink-0">
              <UserIcon className="size-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">Profile</div>
              <div className="text-xs text-muted-foreground">Edit your details</div>
            </div>
            <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
          </Link>
        </div>
      </div>

      {/* Invite code */}
      {settingsRes.data?.invite_code && (
        <div className="mt-8 rounded-xl border bg-primary p-5 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Your invite code</div>
            <CopyButton text={settingsRes.data.invite_code} />
          </div>
          <div className="mt-2 text-2xl font-mono font-bold tracking-widest">
            {settingsRes.data.invite_code}
          </div>
          <p className="mt-2 text-xs opacity-80">
            Share this code with students so they can sign up and link to your account.
          </p>
        </div>
      )}
    </div>
  );
}
