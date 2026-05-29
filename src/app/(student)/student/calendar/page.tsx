import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentCalendar from "./StudentCalendar";

export default async function StudentCalendarPage() {
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
        <h1 className="text-xl font-bold">Calendar</h1>
        <p className="mt-4 text-muted-foreground">Link to an instructor to see your lessons.</p>
      </div>
    );
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, start_at, end_at, status, pickup_location, price_pence")
    .eq("student_id", studentRecord.id)
    .neq("status", "cancelled")
    .order("start_at");

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold md:text-2xl">My Calendar</h1>
        <p className="text-sm text-muted-foreground">View your lesson schedule.</p>
      </div>
      <StudentCalendar bookings={bookings ?? []} />
    </div>
  );
}
