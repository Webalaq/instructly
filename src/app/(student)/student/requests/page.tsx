import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import RequestForm from "./RequestForm";
import StudentRequestActions from "./StudentRequestActions";

export default async function StudentRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ reschedule?: string; bookingTime?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "student") redirect("/login");

  const { data: studentRecord } = await supabase
    .from("students")
    .select("id, instructor_id")
    .eq("profile_id", user.id)
    .single();

  if (!studentRecord) {
    return (
      <div className="px-4 py-6 md:px-8">
        <h1 className="text-xl font-bold">Request a Lesson</h1>
        <p className="mt-4 text-muted-foreground">Link to an instructor first.</p>
      </div>
    );
  }

  const [{ data: availabilitySlots }, { data: existingBookings }, { data: requests }] = await Promise.all([
    supabase
      .from("availability_slots")
      .select("day_of_week, start_time, end_time, type, date")
      .eq("instructor_id", studentRecord.instructor_id),
    supabase
      .from("bookings")
      .select("id, start_at, end_at")
      .eq("instructor_id", studentRecord.instructor_id)
      .eq("status", "scheduled"),
    supabase
      .from("lesson_requests")
      .select("*")
      .eq("student_id", studentRecord.id)
      .order("created_at", { ascending: false }),
  ]);

  const recurring = (availabilitySlots ?? [])
    .filter((s) => s.type === "recurring")
    .map((s) => ({
      day_of_week: s.day_of_week!,
      start_time: s.start_time!,
      end_time: s.end_time!,
    }));
  const blocked = (availabilitySlots ?? [])
    .filter((s) => s.type === "blocked")
    .map((s) => s.date!);
  const bookingsForSlots = (existingBookings ?? []).map((b) => ({
    start_at: b.start_at,
    end_at: b.end_at,
  }));

  const params = await searchParams;
  const rescheduleBookingId = params.reschedule ?? null;
  const rescheduleBookingTime = params.bookingTime ?? null;

  const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    pending: "outline",
    accepted: "default",
    declined: "destructive",
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold md:text-2xl">
          {rescheduleBookingId ? "Reschedule Lesson" : "Request a Lesson"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {rescheduleBookingId
            ? "Pick a new time for your lesson."
            : "Choose from your instructor's available times."}
        </p>
      </div>

      {recurring.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Your instructor hasn&apos;t set up their availability yet.
        </div>
      ) : (
        <div className="max-w-lg">
          <RequestForm
            recurring={recurring}
            blocked={blocked}
            bookings={bookingsForSlots}
            rescheduleBookingId={rescheduleBookingId}
            rescheduleBookingTime={rescheduleBookingTime}
          />
        </div>
      )}

      {requests && requests.length > 0 && (
        <div className="mt-8 max-w-lg">
          <h2 className="text-base font-semibold mb-3">Your requests</h2>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="rounded-lg border bg-card px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {format(parseISO(r.preferred_date), "EEE d MMM")} at {r.preferred_time}
                      </span>
                      {r.type === "reschedule" && (
                        <Badge variant="secondary" className="text-[10px]">reschedule</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.duration_minutes} min
                      {r.message && ` · "${r.message}"`}
                      {r.initiated_by === "instructor" && " · Proposed by instructor"}
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>
                    {r.status}
                  </Badge>
                </div>
                {r.initiated_by === "instructor" && r.status === "pending" && (
                  <StudentRequestActions requestId={r.id} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
