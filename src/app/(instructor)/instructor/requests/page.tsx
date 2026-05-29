import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import RequestActions from "./RequestActions";

export default async function InstructorRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "instructor") redirect("/login");

  const { data: requests } = await supabase
    .from("lesson_requests")
    .select("*, students(full_name)")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });

  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const past = (requests ?? []).filter((r) => r.status !== "pending");

  const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    pending: "outline",
    accepted: "default",
    declined: "destructive",
  };

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold md:text-2xl">Lesson Requests</h1>
        <p className="text-sm text-muted-foreground">
          Review lesson requests from your students.
        </p>
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-3">
            Pending ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((r) => {
              const student = Array.isArray(r.students) ? r.students[0] : r.students;
              return (
                <div key={r.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{student?.full_name ?? "Unknown"}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {format(parseISO(r.preferred_date), "EEE d MMM yyyy")} at {r.preferred_time}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {r.duration_minutes} minutes
                      </div>
                      {r.message && (
                        <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                          &ldquo;{r.message}&rdquo;
                        </div>
                      )}
                    </div>
                    <Badge variant="outline">pending</Badge>
                  </div>
                  <RequestActions requestId={r.id} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No pending */}
      {pending.length === 0 && (
        <div className="mb-8 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No pending requests
        </div>
      )}

      {/* Past requests */}
      {past.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Previous requests</h2>
          <div className="space-y-2">
            {past.map((r) => {
              const student = Array.isArray(r.students) ? r.students[0] : r.students;
              return (
                <div key={r.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
                  <div>
                    <div className="text-sm font-medium">{student?.full_name ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(r.preferred_date), "d MMM")} at {r.preferred_time} · {r.duration_minutes}min
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT[r.status] ?? "outline"}>
                    {r.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
