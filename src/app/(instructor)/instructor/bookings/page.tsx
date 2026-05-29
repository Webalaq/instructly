import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Booking } from "@/lib/schemas/booking";
import type { Student } from "@/lib/schemas/student";
import WeekCalendar from "./WeekCalendar";

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "instructor") {
    redirect("/login");
  }

  const [bookingsRes, studentsRes, settingsRes, availRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, students(id, full_name)")
      .eq("instructor_id", user.id)
      .order("start_at", { ascending: true }),
    supabase
      .from("students")
      .select("*")
      .eq("instructor_id", user.id)
      .neq("status", "inactive")
      .order("full_name"),
    supabase
      .from("instructor_settings")
      .select("hourly_rate_pence, default_lesson_minutes")
      .eq("instructor_id", user.id)
      .single(),
    supabase
      .from("availability_slots")
      .select("day_of_week, start_time, end_time, type, date")
      .eq("instructor_id", user.id),
  ]);

  const bookings = (bookingsRes.data ?? []) as Booking[];
  const students = (studentsRes.data ?? []) as Student[];
  const settings = settingsRes.data;
  const availSlots = availRes.data ?? [];
  const recurring = availSlots
    .filter((s) => s.type === "recurring")
    .map((s) => ({ day_of_week: s.day_of_week!, start_time: s.start_time!, end_time: s.end_time! }));
  const blocked = availSlots
    .filter((s) => s.type === "blocked")
    .map((s) => s.date!);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="text-muted-foreground">
          Manage your lesson schedule.
        </p>
      </div>

      <WeekCalendar
        bookings={bookings}
        students={students}
        defaultPricePence={settings?.hourly_rate_pence ?? 4000}
        defaultLessonMinutes={settings?.default_lesson_minutes ?? 60}
        recurring={recurring}
        blocked={blocked}
      />
    </main>
  );
}
