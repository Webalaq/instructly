"use client";

import type {
  UseFormWatch,
  UseFormSetValue,
} from "react-hook-form";
import type { OnboardingValues } from "@/lib/schemas/onboarding";
import { Button } from "@/components/ui/button";

interface StepWorkingHoursProps {
  watch: UseFormWatch<OnboardingValues>;
  setValue: UseFormSetValue<OnboardingValues>;
  error?: string;
}

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
] as const;

type DayKey = (typeof DAYS)[number]["key"];

const DEFAULT_SLOT = { start: "09:00", end: "17:00" };

export default function StepWorkingHours({
  watch,
  setValue,
  error,
}: StepWorkingHoursProps) {
  const workingHours = watch("workingHours") ?? {};

  function toggleDay(day: DayKey) {
    const current = { ...workingHours };
    if (current[day] && current[day].length > 0) {
      delete current[day];
    } else {
      current[day] = [{ ...DEFAULT_SLOT }];
    }
    setValue("workingHours", current, { shouldValidate: true });
  }

  function updateSlot(
    day: DayKey,
    index: number,
    field: "start" | "end",
    value: string
  ) {
    const current = { ...workingHours };
    const slots = [...(current[day] || [])];
    slots[index] = { ...slots[index], [field]: value };
    current[day] = slots;
    setValue("workingHours", current, { shouldValidate: true });
  }

  function addSlot(day: DayKey) {
    const current = { ...workingHours };
    const slots = [...(current[day] || [])];
    const lastSlot = slots[slots.length - 1];
    slots.push({
      start: lastSlot?.end || "13:00",
      end: "17:00",
    });
    current[day] = slots;
    setValue("workingHours", current, { shouldValidate: true });
  }

  function removeSlot(day: DayKey, index: number) {
    const current = { ...workingHours };
    const slots = [...(current[day] || [])];
    slots.splice(index, 1);
    if (slots.length === 0) {
      delete current[day];
    } else {
      current[day] = slots;
    }
    setValue("workingHours", current, { shouldValidate: true });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Working hours</h2>
        <p className="text-sm text-muted-foreground">
          Set which days and times you teach. You can add split shifts.
        </p>
      </div>

      <div className="space-y-3">
        {DAYS.map(({ key, label }) => {
          const slots = workingHours[key] || [];
          const isActive = slots.length > 0;

          return (
            <div
              key={key}
              className={`rounded-md border px-4 py-3 ${
                isActive ? "border-primary/30 bg-primary/5" : "border-input"
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => toggleDay(key)}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input"
                    }`}
                  >
                    {isActive && "✓"}
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </button>

                {isActive && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addSlot(key)}
                  >
                    + Add slot
                  </Button>
                )}
              </div>

              {isActive && (
                <div className="mt-3 space-y-2 pl-8">
                  {slots.map((slot, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) =>
                          updateSlot(key, i, "start", e.target.value)
                        }
                        className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) =>
                          updateSlot(key, i, "end", e.target.value)
                        }
                        className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                      />
                      {slots.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSlot(key, i)}
                          className="h-9 px-2 text-muted-foreground hover:text-destructive"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
