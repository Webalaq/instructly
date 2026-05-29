"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";

interface SkillEntry {
  rating: number;
  date: string;
}

interface SkillData {
  skill: string;
  label: string;
  entries: SkillEntry[];
}

export default function SkillTimeline({ data }: { data: SkillData[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  // Show either selected skill or aggregate
  const displayData = selected
    ? data.filter((d) => d.skill === selected)
    : data;

  // Build aggregate timeline (average across all skills per date)
  const aggregateByDate = new Map<string, { sum: number; count: number }>();
  for (const skill of data) {
    for (const entry of skill.entries) {
      const dateKey = entry.date.slice(0, 10);
      const existing = aggregateByDate.get(dateKey) ?? { sum: 0, count: 0 };
      existing.sum += entry.rating;
      existing.count += 1;
      aggregateByDate.set(dateKey, existing);
    }
  }

  const chartPoints = selected
    ? displayData[0]?.entries.map((e) => ({
        date: e.date,
        value: e.rating,
      })) ?? []
    : Array.from(aggregateByDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, { sum, count }]) => ({
          date,
          value: Math.round((sum / count) * 10) / 10,
        }));

  const maxVal = 5;

  return (
    <div className="space-y-4">
      {/* Skill filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !selected ? "bg-primary text-primary-foreground" : "border border-input hover:bg-accent"
          }`}
        >
          All skills
        </button>
        {data.map((d) => (
          <button
            key={d.skill}
            type="button"
            onClick={() => setSelected(d.skill === selected ? null : d.skill)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selected === d.skill ? "bg-primary text-primary-foreground" : "border border-input hover:bg-accent"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {chartPoints.length >= 2 ? (
        <div className="rounded-xl border bg-card p-4">
          <div className="relative h-40">
            {/* Y-axis labels */}
            {[1, 2, 3, 4, 5].map((v) => (
              <div
                key={v}
                className="absolute left-0 text-[10px] text-muted-foreground"
                style={{ bottom: `${((v - 1) / (maxVal - 1)) * 100}%`, transform: "translateY(50%)" }}
              >
                {v}
              </div>
            ))}

            {/* Grid lines */}
            {[1, 2, 3, 4, 5].map((v) => (
              <div
                key={v}
                className="absolute left-6 right-0 border-t border-dashed border-border/50"
                style={{ bottom: `${((v - 1) / (maxVal - 1)) * 100}%` }}
              />
            ))}

            {/* Data points and lines */}
            <svg className="absolute left-6 top-0 h-full w-[calc(100%-24px)]" viewBox={`0 0 ${Math.max(chartPoints.length - 1, 1) * 100} 100`} preserveAspectRatio="none">
              {/* Line */}
              <polyline
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                points={chartPoints.map((p, i) => {
                  const x = chartPoints.length === 1 ? 50 : (i / (chartPoints.length - 1)) * (chartPoints.length - 1) * 100;
                  const y = 100 - ((p.value - 1) / (maxVal - 1)) * 100;
                  return `${x},${y}`;
                }).join(" ")}
              />
              {/* Dots */}
              {chartPoints.map((p, i) => {
                const x = chartPoints.length === 1 ? 50 : (i / (chartPoints.length - 1)) * (chartPoints.length - 1) * 100;
                const y = 100 - ((p.value - 1) / (maxVal - 1)) * 100;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="var(--color-primary)"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>
          </div>

          {/* X-axis dates */}
          <div className="mt-2 flex justify-between pl-6 text-[10px] text-muted-foreground">
            <span>{format(parseISO(chartPoints[0].date), "d MMM")}</span>
            <span>{format(parseISO(chartPoints[chartPoints.length - 1].date), "d MMM")}</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {chartPoints.length === 1
            ? "Need at least 2 data points to show a chart. Keep going!"
            : "No ratings yet. Your instructor will rate your skills after each lesson."}
        </div>
      )}
    </div>
  );
}
