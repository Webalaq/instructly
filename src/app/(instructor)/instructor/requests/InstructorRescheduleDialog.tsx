"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { computeAvailableSlots, type RecurringSlot, type ExistingBooking } from "@/lib/availability";
import { submitInstructorReschedule } from "./actions";

type Props = {
  bookingId: string;
  currentStartAt: string;
  durationMinutes: number;
  recurring: RecurringSlot[];
  blocked: string[];
  bookings: ExistingBooking[];
  trigger: React.ReactNode;
};

const WEEKS_AHEAD = 3;

export default function InstructorRescheduleDialog({
  bookingId,
  currentStartAt,
  durationMinutes,
  recurring,
  blocked,
  bookings,
  trigger,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startDate = addDays(new Date(), weekOffset * 7);
  const endDate = addDays(startDate, 6);

  const slots = useMemo(() => {
    const sd = addDays(new Date(), weekOffset * 7);
    const ed = addDays(sd, 6);
    return computeAvailableSlots({
      recurring,
      blocked,
      bookings: bookings.filter((b) => b.start_at !== currentStartAt),
      startDate: format(sd, "yyyy-MM-dd"),
      endDate: format(ed, "yyyy-MM-dd"),
      durationMinutes,
    });
  }, [recurring, blocked, bookings, durationMinutes, weekOffset, currentStartAt]);

  const slotsByDate = useMemo(() => {
    const map = new Map<string, { start: string; end: string }[]>();
    for (const slot of slots) {
      const dateKey = slot.start.slice(0, 10);
      const arr = map.get(dateKey) ?? [];
      arr.push(slot);
      map.set(dateKey, arr);
    }
    return map;
  }, [slots]);

  async function handleSubmit() {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);

    const result = await submitInstructorReschedule({
      bookingId,
      proposedStartAt: selectedSlot.start,
      proposedEndAt: selectedSlot.end,
      durationMinutes,
    });

    if ("error" in result && result.error) {
      setError(result.error);
      setSelectedSlot(null);
    } else {
      setOpen(false);
      setSelectedSlot(null);
      router.refresh();
    }
    setSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button type="button" onClick={() => setOpen(true)}>
        {trigger}
      </button>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Lesson</DialogTitle>
          <DialogDescription>
            Current: {format(parseISO(currentStartAt), "EEE d MMM 'at' HH:mm")}. Pick a new time — student will need to approve.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" className="size-9" onClick={() => setWeekOffset((w) => Math.max(0, w - 1))} disabled={weekOffset === 0}>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(startDate, "d MMM")} – {format(endDate, "d MMM")}
            </span>
            <Button variant="outline" size="icon" className="size-9" onClick={() => setWeekOffset((w) => Math.min(WEEKS_AHEAD - 1, w + 1))} disabled={weekOffset >= WEEKS_AHEAD - 1}>
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>

          {slotsByDate.size === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No available slots this week.</div>
          ) : (
            Array.from(slotsByDate.entries()).map(([dateKey, daySlots]) => (
              <div key={dateKey}>
                <div className="mb-2 text-sm font-semibold">{format(parseISO(dateKey), "EEEE d MMMM")}</div>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((slot) => {
                    const isSelected = selectedSlot?.start === slot.start;
                    return (
                      <button
                        key={slot.start}
                        type="button"
                        onClick={() => setSelectedSlot(isSelected ? null : slot)}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors active:scale-95 ${
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
                        }`}
                      >
                        {format(parseISO(slot.start), "HH:mm")}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
          )}

          <Button onClick={handleSubmit} disabled={!selectedSlot || submitting} className="w-full">
            {submitting ? "Sending..." : "Propose new time"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
