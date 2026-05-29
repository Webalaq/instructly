import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  SKILL_CATEGORIES,
  SKILL_LABELS,
  type SkillKey,
} from "@/lib/schemas/lesson-notes";
import SkillTimeline from "./SkillTimeline";
import ExportButton from "./ExportButton";

export default async function StudentProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "student") {
    redirect("/login");
  }

  const { data: studentRecord } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!studentRecord) {
    return (
      <div className="px-4 py-6 md:px-8">
        <h1 className="text-xl font-bold">Progress</h1>
        <p className="mt-4 text-muted-foreground">
          You haven&apos;t been linked to an instructor yet.
        </p>
      </div>
    );
  }

  const { data: ratings } = await supabase
    .from("skill_ratings")
    .select("skill_key, rating, created_at")
    .eq("student_id", studentRecord.id)
    .order("created_at", { ascending: true });

  // Latest rating per skill
  const latestRatings = new Map<string, number>();
  const allRatings = new Map<string, { rating: number; date: string }[]>();

  for (const r of ratings ?? []) {
    latestRatings.set(r.skill_key, r.rating);
    const existing = allRatings.get(r.skill_key) ?? [];
    existing.push({ rating: r.rating, date: r.created_at });
    allRatings.set(r.skill_key, existing);
  }

  const allLatest = Array.from(latestRatings.values());
  const overallAvg = allLatest.length > 0
    ? (allLatest.reduce((a, b) => a + b, 0) / allLatest.length).toFixed(1)
    : "—";

  // Prepare timeline data for the chart
  const timelineData = Array.from(allRatings.entries()).map(([key, entries]) => ({
    skill: key,
    label: SKILL_LABELS[key as SkillKey] ?? key,
    entries,
  }));

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Your Progress</h1>
          <p className="text-sm text-muted-foreground">Track your driving skill development.</p>
        </div>
        <ExportButton />
      </div>

      {/* Overall score */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-3xl font-bold text-primary">{overallAvg}</div>
          <div className="text-xs text-muted-foreground">Average</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-3xl font-bold">{latestRatings.size}</div>
          <div className="text-xs text-muted-foreground">Skills rated</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-3xl font-bold">{(ratings ?? []).length}</div>
          <div className="text-xs text-muted-foreground">Total ratings</div>
        </div>
      </div>

      {/* Progress timeline chart */}
      {timelineData.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-4">Skill progression over time</h2>
          <SkillTimeline data={timelineData} />
        </div>
      )}

      {/* Skill breakdown by category */}
      <div className="space-y-6">
        <h2 className="text-base font-semibold">Detailed breakdown</h2>
        {SKILL_CATEGORIES.map((cat) => (
          <div key={cat.key} className="rounded-xl border bg-card p-4">
            <h3 className="mb-3 font-semibold">{cat.label}</h3>
            <div className="space-y-3">
              {cat.skills.map((skillKey) => {
                const rating = latestRatings.get(skillKey);
                const history = allRatings.get(skillKey);
                const trend = history && history.length >= 2
                  ? history[history.length - 1].rating - history[history.length - 2].rating
                  : 0;
                return (
                  <div key={skillKey} className="flex items-center justify-between">
                    <span className="text-sm">{SKILL_LABELS[skillKey as SkillKey]}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-24 rounded-full bg-muted sm:w-28">
                        <div
                          className="h-3 rounded-full bg-primary transition-all"
                          style={{ width: rating ? `${(rating / 5) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="w-6 text-right text-sm font-semibold">
                        {rating ?? "—"}
                      </span>
                      {trend !== 0 && (
                        <span className={`text-xs font-medium ${trend > 0 ? "text-primary" : "text-destructive"}`}>
                          {trend > 0 ? "↑" : "↓"}
                        </span>
                      )}
                      {history && history.length > 1 && (
                        <span className="text-[10px] text-muted-foreground">
                          ({history.length})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
