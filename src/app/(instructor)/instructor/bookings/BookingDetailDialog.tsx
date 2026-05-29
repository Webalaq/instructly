"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import type { Booking } from "@/lib/schemas/booking";
import type { Student } from "@/lib/schemas/student";
import type { RecurringSlot, ExistingBooking } from "@/lib/availability";
import { cancelBooking, completeBooking } from "./actions";
import BookingDialog from "./BookingDialog";
import LessonNoteDialog from "./LessonNoteDialog";
import InstructorRescheduleDialog from "../requests/InstructorRescheduleDialog";

interface BookingDetailDialogProps {
  booking: Booking;
  students: Student[];
  defaultPricePence: number;
  defaultLessonMinutes: number;
  recurring: RecurringSlot[];
  blocked: string[];
  existingBookings: ExistingBooking[];
  trigger: React.ReactNode;
}

const STATUS_VARIANT: Record<Booking["status"], "default" | "secondary" | "outline" | "destructive"> = {
  scheduled: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "outline",
};

export default function BookingDetailDialog({
  booking,
  students,
  defaultPricePence,
  defaultLessonMinutes,
  recurring,
  blocked,
  existingBookings,
  trigger,
}: BookingDetailDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [loading, setLoading] = useState(false);

  const studentName = students.find((s) => s.id === booking.student_id)?.full_name ?? "Unknown";

  async function handleCancel() {
    setLoading(true);
    await cancelBooking(booking.id, cancelReason);
    setOpen(false);
    setCancelling(false);
    setLoading(false);
    router.refresh();
  }

  async function handleComplete() {
    setLoading(true);
    await completeBooking(booking.id);
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button type="button" onClick={() => setOpen(true)} className="w-full text-left">
        {trigger}
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Booking details</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Student</span>
            <span className="font-medium">{studentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span>{format(parseISO(booking.start_at), "EEE d MMM yyyy")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time</span>
            <span>
              {format(parseISO(booking.start_at), "HH:mm")} – {format(parseISO(booking.end_at), "HH:mm")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={STATUS_VARIANT[booking.status]}>{booking.status}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price</span>
            <span>£{(booking.price_pence / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paid</span>
            <span>{booking.paid ? "Yes" : "No"}</span>
          </div>
          {booking.pickup_location && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pickup</span>
              <span>{booking.pickup_location}</span>
            </div>
          )}
          {booking.cancellation_reason && (
            <div className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <span className="text-xs font-medium text-destructive">Cancellation reason</span>
              <p className="mt-1 text-sm">{booking.cancellation_reason}</p>
            </div>
          )}
        </div>

        {cancelling && (
          <div className="space-y-2 mt-4">
            <Label htmlFor="cancelReason">Cancellation reason</Label>
            <Input
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Optional reason..."
            />
          </div>
        )}

        <DialogFooter>
          {cancelling ? (
            <>
              <Button
                variant="outline"
                onClick={() => setCancelling(false)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={loading}
              >
                {loading ? "Cancelling..." : "Confirm cancel"}
              </Button>
            </>
          ) : (
            <>
              <DialogClose render={<Button type="button" variant="outline" />}>
                Close
              </DialogClose>
              {booking.status === "completed" && (
                <LessonNoteDialog
                  bookingId={booking.id}
                  trigger={<Button variant="outline">Lesson notes</Button>}
                />
              )}
              {booking.status === "scheduled" && (
                <>
                  <BookingDialog
                    mode="edit"
                    booking={booking}
                    students={students}
                    defaultPricePence={defaultPricePence}
                    defaultLessonMinutes={defaultLessonMinutes}
                    trigger={<Button variant="outline">Edit</Button>}
                  />
                  <InstructorRescheduleDialog
                    bookingId={booking.id}
                    currentStartAt={booking.start_at}
                    durationMinutes={Math.round((new Date(booking.end_at).getTime() - new Date(booking.start_at).getTime()) / 60000)}
                    recurring={recurring}
                    blocked={blocked}
                    bookings={existingBookings}
                    trigger={<Button variant="outline">Reschedule</Button>}
                  />
                  <Button variant="destructive" onClick={() => setCancelling(true)}>
                    Cancel
                  </Button>
                  <Button onClick={handleComplete} disabled={loading}>
                    {loading ? "..." : "Complete"}
                  </Button>
                </>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
