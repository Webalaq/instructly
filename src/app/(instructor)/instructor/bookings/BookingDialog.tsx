"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AhaToast } from "@/components/AhaToast";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import type { Booking } from "@/lib/schemas/booking";
import type { Student } from "@/lib/schemas/student";
import { createBooking, updateBooking } from "./actions";

interface BookingDialogProps {
  mode: "add" | "edit";
  booking?: Booking;
  students: Student[];
  defaultDate?: string;
  defaultPricePence?: number;
  defaultLessonMinutes?: number;
  trigger: React.ReactNode;
}

export default function BookingDialog({
  mode,
  booking,
  students,
  defaultDate,
  defaultPricePence = 4000,
  defaultLessonMinutes = 60,
  trigger,
}: BookingDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAha, setShowAha] = useState(false);

  // Form state
  const [studentId, setStudentId] = useState(booking?.student_id ?? "");
  const [date, setDate] = useState(
    booking ? booking.start_at.slice(0, 10) : (defaultDate ?? format(new Date(), "yyyy-MM-dd"))
  );
  const [startTime, setStartTime] = useState(
    booking ? booking.start_at.slice(11, 16) : "09:00"
  );
  const [durationHours, setDurationHours] = useState(() => {
    if (booking) {
      const diffMs = new Date(booking.end_at).getTime() - new Date(booking.start_at).getTime();
      return Math.floor(diffMs / 3600000);
    }
    return Math.floor(defaultLessonMinutes / 60);
  });
  const [durationMinutes, setDurationMinutes] = useState(() => {
    if (booking) {
      const diffMs = new Date(booking.end_at).getTime() - new Date(booking.start_at).getTime();
      return Math.floor((diffMs % 3600000) / 60000);
    }
    return defaultLessonMinutes % 60;
  });
  const [pickupLocation, setPickupLocation] = useState(booking?.pickup_location ?? "");
  const [pricePence, setPricePence] = useState(booking?.price_pence ?? defaultPricePence);

  // Auto-calculate end time
  const endTime = useMemo(() => {
    const [h, m] = startTime.split(":").map(Number);
    const totalMinutes = h * 60 + m + durationHours * 60 + durationMinutes;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    return `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
  }, [startTime, durationHours, durationMinutes]);

  const totalDuration = durationHours * 60 + durationMinutes;

  const activeStudents = students.filter((s) => s.status !== "inactive");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId || !date || !startTime || totalDuration < 15) return;

    setServerError(null);
    setSubmitting(true);

    const startAt = new Date(`${date}T${startTime}`).toISOString();
    const endAt = new Date(`${date}T${endTime}`).toISOString();

    const payload = {
      studentId,
      startAt,
      endAt,
      pickupLocation: pickupLocation || "",
      pricePence,
    };

    const result =
      mode === "edit" && booking
        ? await updateBooking(booking.id, {
            ...payload,
            status: booking.status,
            paid: booking.paid,
          })
        : await createBooking(payload);

    if ("error" in result && result.error) {
      setServerError(result.error);
      setSubmitting(false);
      return;
    }

    setOpen(false);
    setSubmitting(false);
    if (mode === "add") setShowAha(true);
    router.refresh();
  }

  const hideAha = useCallback(() => setShowAha(false), []);

  return (
    <>
    <Dialog open={open} onOpenChange={setOpen}>
      <button type="button" onClick={() => setOpen(true)}>
        {trigger}
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit booking" : "New booking"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update booking details." : "Schedule a lesson with a student."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student */}
          <div className="space-y-2">
            <Label htmlFor="studentId">Student *</Label>
            <select
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            >
              <option value="">Select a student</option>
              {activeStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Start time */}
          <div className="space-y-2">
            <Label htmlFor="startTime">Start time *</Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                >
                  {[0, 1, 2, 3].map((h) => (
                    <option key={h} value={h}>{h} hr</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>{m} min</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Calculated end time */}
          <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Ends at </span>
            <span className="font-semibold text-primary">{endTime}</span>
            <span className="text-muted-foreground"> · {totalDuration} minutes</span>
          </div>

          {/* Pickup */}
          <div className="space-y-2">
            <Label htmlFor="pickupLocation">Pickup location</Label>
            <Input
              id="pickupLocation"
              placeholder="e.g. 42 High Street"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="pricePounds">Price (£)</Label>
            <Input
              id="pricePounds"
              type="number"
              min={0}
              step={0.5}
              value={(pricePence / 100).toFixed(2)}
              onChange={(e) => setPricePence(Math.round(Number(e.target.value) * 100))}
            />
          </div>

          {serverError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={submitting || !studentId || totalDuration < 15}>
              {submitting
                ? mode === "edit" ? "Saving..." : "Booking..."
                : mode === "edit" ? "Save changes" : "Create booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <AhaToast
      show={showAha}
      title="Lesson booked!"
      message="A WhatsApp reminder will automatically send 24 hours before the lesson. No chasing needed."
      onClose={hideAha}
    />
    </>
  );
}
