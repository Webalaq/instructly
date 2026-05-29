"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { computeAvailableSlots, type RecurringSlot, type BlockedDate, type ExistingBooking } from "@/lib/availability";
import { submitLessonRequest, submitRescheduleRequest } from "./actions";

type Props = {
  recurring: RecurringSlot[];
  blocked: BlockedDate[];
  bookings: ExistingBooking[];
  rescheduleBookingId?: string | null;
  rescheduleBookingTime?: string | null;
};

const DURATIONS = [
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

const WEEKS_AHEAD = 3;

export default function RequestForm({ recurring, blocked, bookings, rescheduleBookingId, rescheduleBookingTime }: Props) {
  const router = useRouter();
  const [duration, setDuration] = useState(60);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startDate = addDays(new Date(), weekOffset * 7);
  const endDate = addDays(startDate, 6);

  const slots = useMemo(() => {
    const sd = addDays(new Date(), weekOffset * 7);
    const ed = addDays(sd, 6);
    return computeAvailableSlots({
      recurring,
      blocked,
      bookings,
      startDate: format(sd, "yyyy-MM-dd"),
      endDate: format(ed, "yyyy-MM-dd"),
      durationMinutes: duration,
    });
  }, [recurring, blocked, bookings, duration, weekOffset]);

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
    setSuccess(false);

    const payload = {
      proposedStartAt: selectedSlot.start,
      proposedEndAt: selectedSlot.end,
      durationMinutes: duration,
      message,
    };

    const result = rescheduleBookingId
      ? await submitRescheduleRequest({ ...payload, bookingId: rescheduleBookingId })
      : await submitLessonRequest(payload);

    if ("error" in result && result.error) {
      setError(result.error);
      setSelectedSlot(null);
    } else {
      setSuccess(true);
      setSelectedSlot(null);
      setMessage("");
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-5">
      {rescheduleBookingId && rescheduleBookingTime && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          Rescheduling lesson on <span className="font-semibold">{format(parseISO(rescheduleBookingTime), "EEE d MMM 'at' HH:mm")}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label>Lesson duration</Label>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <Button
              key={d.value}
              type="button"
              variant={duration === d.value ? "default" : "outline"}
              size="sm"
              className="flex-1 h-10"
              onClick={() => { setDuration(d.value); setSelectedSlot(null); }}
            >
              {d.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          className="size-10"
          onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
          disabled={weekOffset === 0}
        >
          <ChevronLeftIcon className="size-5" />
        </Button>
        <span className="text-sm font-medium">
          {format(startDate, "d MMM")} – {format(endDate, "d MMM yyyy")}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-10"
          onClick={() => setWeekOffset((w) => Math.min(WEEKS_AHEAD - 1, w + 1))}
          disabled={weekOffset >= WEEKS_AHEAD - 1}
        >
          <ChevronRightIcon className="size-5" />
        </Button>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        {slotsByDate.size === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No available slots this week. Try another week or duration.
          </div>
        ) : (
          Array.from(slotsByDate.entries()).map(([dateKey, daySlots]) => (
            <div key={dateKey}>
              <div className="mb-2 text-sm font-semibold">
                {format(parseISO(dateKey), "EEEE d MMMM")}
              </div>
              <div className="flex flex-wrap gap-2">
                {daySlots.map((slot) => {
                  const isSelected = selectedSlot?.start === slot.start;
                  return (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => setSelectedSlot(isSelected ? null : slot)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors active:scale-95 ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "hover:bg-accent active:bg-accent/70"
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
      </div>

      {selectedSlot && (
        <div className="rounded-lg border bg-accent/30 px-4 py-3 text-sm">
          Selected: <span className="font-semibold">
            {format(parseISO(selectedSlot.start), "EEE d MMM")} at {format(parseISO(selectedSlot.start), "HH:mm")} – {format(parseISO(selectedSlot.end), "HH:mm")}
          </span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="message">Message (optional)</Label>
        <Textarea
          id="message"
          rows={2}
          placeholder="e.g. I'd like to practice roundabouts"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="text-base sm:text-sm"
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}
      {success && (
        <div className="rounded-md border border-primary/50 bg-primary/10 px-4 py-3 text-sm text-primary">
          {rescheduleBookingId ? "Reschedule request sent!" : "Request sent to your instructor."}
        </div>
      )}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedSlot || submitting}
        className="w-full h-12"
      >
        {submitting ? "Sending..." : rescheduleBookingId ? "Request reschedule" : "Send request"}
      </Button>
    </div>
  );
}
