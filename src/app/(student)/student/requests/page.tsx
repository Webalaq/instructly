import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import RequestForm from "./RequestForm";

export default async function StudentRequestsPage() {
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

  // Get instructor's availability
  const { data: availabilitySlots } = await supabase
    .from("availability_slots")
    .select("day_of_week, start_time, end_time, type, date")
    .eq("instructor_id", studentRecord.instructor_id)
    .order("day_of_week");

  const recurring = (availabilitySlots ?? []).filter((s) => s.type === "recurring");
  const blocked = (availabilitySlots ?? []).filter((s) => s.type === "blocked").map((s) => s.date);

  const { data: requests } = await supabase
    .from("lesson_requests")
    .select("*")
    .eq("student_id", studentRecord.id)
    .order("created_at", { ascending: false });

  const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    pending: "outline",
    accepted: "default",
    declined: "destructive",
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold md:text-2xl">Request a Lesson</h1>
        <p className="text-sm text-muted-foreground">
          Suggest your preferred times and your instructor will confirm.
        </p>
      </div>

      {/* Instructor availability hint */}
      {recurring.length > 0 && (
        <div className="mb-6 max-w-lg rounded-xl border bg-card p-4">
          <h3 className="text-sm font-medium mb-2">Your instructor&apos;s working hours</h3>
          <div className="grid grid-cols-2 gap-1.5 text-sm">
            {recurring.map((s, i) => (
              <div key={i} className="flex justify-between text-muted-foreground">
                <span>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][s.day_of_week ?? 0]}</span>
                <span className="font-medium text-foreground">
                  {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}
                </span>
              </div>
            ))}
          </div>
          {blocked.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {blocked.length} date(s) blocked
            </p>
          )}
        </div>
      )}

      <div className="max-w-lg">
        <RequestForm />
      </div>

      {/* Past requests */}
      {requests && requests.length > 0 && (
        <div className="mt-8 max-w-lg">
          <h2 className="text-base font-semibold mb-3">Your requests</h2>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                <div>
                  <div className="text-sm font-medium">
                    {format(parseISO(r.preferred_date), "EEE d MMM")} at {r.preferred_time}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.duration_minutes} min
                    {r.message && ` · "${r.message}"`}
                  </div>
                </div>
                <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
