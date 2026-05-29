"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AvailabilitySlot } from "@/lib/schemas/booking";
import { addRecurringSlot, addBlockedDate, deleteSlot } from "./actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WORK_DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon–Sat, Sun

export default function AvailabilityManager({ slots }: { slots: AvailabilitySlot[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Add recurring slot form
  const [newDay, setNewDay] = useState(1);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");

  // Block date form
  const [blockDate, setBlockDate] = useState("");

  const recurring = slots.filter((s) => s.type === "recurring");
  const blocked = slots.filter((s) => s.type === "blocked");

  // Group recurring by day
  const byDay = new Map<number, AvailabilitySlot[]>();
  for (const s of recurring) {
    if (s.day_of_week === null) continue;
    const existing = byDay.get(s.day_of_week) ?? [];
    existing.push(s);
    byDay.set(s.day_of_week, existing);
  }

  async function handleAddRecurring(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await addRecurringSlot({ dayOfWeek: newDay, startTime: newStart, endTime: newEnd });
    setLoading(false);
    router.refresh();
  }

  async function handleBlockDate(e: React.FormEvent) {
    e.preventDefault();
    if (!blockDate) return;
    setLoading(true);
    await addBlockedDate({ date: blockDate });
    setBlockDate("");
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setLoading(true);
    await deleteSlot(id);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Weekly schedule */}
      <div>
        <h2 className="text-base font-semibold mb-4">Weekly working hours</h2>
        <div className="space-y-3">
          {WORK_DAYS.map((dayNum) => {
            const daySlots = byDay.get(dayNum) ?? [];
            return (
              <div key={dayNum} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{DAYS[dayNum]}</span>
                  {daySlots.length === 0 && (
                    <span className="text-xs text-muted-foreground">Not set</span>
                  )}
                </div>
                {daySlots.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {daySlots.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2">
                        <span className="text-sm font-medium text-primary">
                          {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(s.id)}
                          disabled={loading}
                          className="text-destructive h-7 w-7 p-0"
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add slot form */}
        <form onSubmit={handleAddRecurring} className="mt-4 rounded-xl border bg-card p-4">
          <h3 className="text-sm font-medium mb-3">Add working hours</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Day</Label>
              <select
                value={newDay}
                onChange={(e) => setNewDay(Number(e.target.value))}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
              >
                {WORK_DAYS.map((d) => (
                  <option key={d} value={d}>{DAYS[d]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start</Label>
              <Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End</Label>
              <Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="h-9" />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={loading} className="mt-3 gap-1">
            <PlusIcon className="size-4" />
            Add slot
          </Button>
        </form>
      </div>

      {/* Blocked dates */}
      <div>
        <h2 className="text-base font-semibold mb-4">Blocked dates (holidays / days off)</h2>

        {blocked.length > 0 && (
          <div className="space-y-2 mb-4">
            {blocked.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5">
                <span className="text-sm">
                  {s.date ? format(parseISO(s.date), "EEE d MMM yyyy") : "Unknown"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(s.id)}
                  disabled={loading}
                  className="text-destructive h-7 w-7 p-0"
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleBlockDate} className="flex items-end gap-3">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Date to block</Label>
            <Input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} className="h-9" />
          </div>
          <Button type="submit" size="sm" variant="outline" disabled={loading || !blockDate} className="gap-1">
            <PlusIcon className="size-4" />
            Block
          </Button>
        </form>
      </div>
    </div>
  );
}
