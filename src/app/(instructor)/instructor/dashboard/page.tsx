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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const TZ = "Europe/London";

export default async function InstructorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "instructor") {
    redirect("/login");
  }

  const now = new Date();
  const todayStart = startOfDay(toZonedTime(now, TZ)).toISOString();
  const todayEnd = endOfDay(toZonedTime(now, TZ)).toISOString();

  const [studentsRes, todayBookingsRes, allBookingsRes, settingsRes] = await Promise.all([
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
  ]);

  const students = studentsRes.data ?? [];
  const todayBookings = todayBookingsRes.data ?? [];
  const allBookings = allBookingsRes.data ?? [];

  const activeStudents = students.filter((s) => s.status === "active").length;
  const totalStudents = students.length;
  const todayLessons = todayBookings.length;
  const completedThisMonth = allBookings.filter((b) => b.status === "completed").length;
  const unpaidCount = allBookings.filter((b) => b.status === "completed" && !b.paid).length;
  const todayEarnings = todayBookings.reduce((sum, b) => sum + (b.price_pence ?? 0), 0);

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-xl font-bold md:text-2xl">
          Good {now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening"}, {user.user_metadata?.full_name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(now, "EEEE d MMMM yyyy")}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarIcon className="size-4" />
            <span className="text-xs font-medium">Today</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{todayLessons}</div>
          <div className="text-xs text-muted-foreground">lessons scheduled</div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <UsersIcon className="size-4" />
            <span className="text-xs font-medium">Students</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{activeStudents}</div>
          <div className="text-xs text-muted-foreground">{totalStudents} total</div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClockIcon className="size-4" />
            <span className="text-xs font-medium">Completed</span>
          </div>
          <div className="mt-2 text-2xl font-bold">{completedThisMonth}</div>
          <div className="text-xs text-muted-foreground">lessons total</div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BanknoteIcon className="size-4" />
            <span className="text-xs font-medium">Today&apos;s earnings</span>
          </div>
          <div className="mt-2 text-2xl font-bold">£{(todayEarnings / 100).toFixed(0)}</div>
          {unpaidCount > 0 && (
            <div className="text-xs text-secondary">{unpaidCount} unpaid</div>
          )}
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
            <span className="hidden sm:inline">New booking</span>
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
                    <div className="text-sm font-medium">£{((b.price_pence ?? 0) / 100).toFixed(0)}</div>
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

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/instructor/students" className="rounded-xl border bg-card p-5 text-center hover:bg-accent active:scale-[0.97] transition-all">
            <UsersIcon className="mx-auto size-7 text-primary" />
            <span className="mt-2 block text-sm font-medium">Students</span>
          </Link>
          <Link href="/instructor/bookings" className="rounded-xl border bg-card p-5 text-center hover:bg-accent active:scale-[0.97] transition-all">
            <CalendarIcon className="mx-auto size-7 text-primary" />
            <span className="mt-2 block text-sm font-medium">Bookings</span>
          </Link>
          <Link href="/instructor/billing" className="rounded-xl border bg-card p-5 text-center hover:bg-accent active:scale-[0.97] transition-all">
            <BanknoteIcon className="mx-auto size-7 text-primary" />
            <span className="mt-2 block text-sm font-medium">Billing</span>
          </Link>
          <Link href="/instructor/profile" className="rounded-xl border bg-card p-5 text-center hover:bg-accent active:scale-[0.97] transition-all">
            <ClockIcon className="mx-auto size-7 text-primary" />
            <span className="mt-2 block text-sm font-medium">Profile</span>
          </Link>
        </div>
      </div>

      {/* Invite code */}
      {settingsRes.data?.invite_code && (
        <div className="mt-8 rounded-xl border bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Your invite code</div>
            <CopyButton text={settingsRes.data.invite_code} />
          </div>
          <div className="mt-1 text-2xl font-mono font-bold tracking-widest text-primary">
            {settingsRes.data.invite_code}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Share this code with students so they can sign up and link to your account.
          </p>
        </div>
      )}
    </div>
  );
}
