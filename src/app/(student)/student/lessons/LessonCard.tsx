"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { MapPinIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cancelStudentBooking, submitStudentFeedback } from "./actions";

type Lesson = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  pickup_location: string | null;
  price_pence: number;
  paid: boolean;
  cancellation_reason: string | null;
  lesson_notes: {
    summary: string;
    homework: string | null;
    student_feedback: string | null;
  }[];
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  scheduled: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "outline",
};

export default function LessonCard({ lesson, canCancel }: { lesson: Lesson; canCancel: boolean }) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [feedback, setFeedback] = useState(lesson.lesson_notes?.[0]?.student_feedback ?? "");

  const note = lesson.lesson_notes?.[0];

  async function handleCancel() {
    setLoading(true);
    await cancelStudentBooking(lesson.id, cancelReason);
    setCancelling(false);
    setLoading(false);
    router.refresh();
  }

  async function handleFeedback() {
    setLoading(true);
    await submitStudentFeedback(lesson.id, feedback);
    setFeedbackMode(false);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">{format(parseISO(lesson.start_at), "EEE d MMM yyyy")}</div>
          <div className="text-sm text-muted-foreground">
            {format(parseISO(lesson.start_at), "HH:mm")} – {format(parseISO(lesson.end_at), "HH:mm")}
          </div>
          {lesson.pickup_location && (
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPinIcon className="size-3.5" />
              {lesson.pickup_location}
            </div>
          )}
        </div>
        <div className="text-right">
          <Badge variant={STATUS_VARIANT[lesson.status] ?? "outline"}>{lesson.status}</Badge>
          <div className="mt-1 text-sm font-medium">£{(lesson.price_pence / 100).toFixed(0)}</div>
        </div>
      </div>

      {/* Lesson notes */}
      {note && (
        <div className="mt-3 space-y-2 border-t pt-3">
          <div>
            <span className="text-xs font-medium text-muted-foreground">Summary</span>
            <p className="text-sm">{note.summary}</p>
          </div>
          {note.homework && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Homework</span>
              <p className="text-sm">{note.homework}</p>
            </div>
          )}
          {note.student_feedback && !feedbackMode && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Your feedback</span>
              <p className="text-sm">{note.student_feedback}</p>
            </div>
          )}
        </div>
      )}

      {/* Cancel form */}
      {cancelling && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <Input
            placeholder="Reason for cancelling (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="h-12 text-base sm:text-sm"
          />
          <div className="flex gap-2">
            <Button variant="outline" className="h-11 flex-1" onClick={() => setCancelling(false)} disabled={loading}>
              Back
            </Button>
            <Button variant="destructive" className="h-11 flex-1" onClick={handleCancel} disabled={loading}>
              {loading ? "Cancelling..." : "Confirm cancel"}
            </Button>
          </div>
        </div>
      )}

      {/* Feedback form */}
      {feedbackMode && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <Textarea
            rows={3}
            placeholder="How did the lesson go? Any feedback..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="text-base sm:text-sm"
          />
          <div className="flex gap-2">
            <Button variant="outline" className="h-11 flex-1" onClick={() => setFeedbackMode(false)} disabled={loading}>
              Cancel
            </Button>
            <Button className="h-11 flex-1" onClick={handleFeedback} disabled={loading || !feedback.trim()}>
              {loading ? "Saving..." : "Save feedback"}
            </Button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!cancelling && !feedbackMode && (
        <div className="mt-3 flex gap-2 border-t pt-3">
          {canCancel && lesson.status === "scheduled" && (
            <>
              <Link
                href={`/student/requests?reschedule=${lesson.id}&bookingTime=${encodeURIComponent(lesson.start_at)}`}
                className={buttonVariants({ variant: "outline", className: "h-11 flex-1 active:scale-95 transition-transform" })}
              >
                Reschedule
              </Link>
              <Button variant="outline" className="h-11 text-destructive active:scale-95 transition-transform" onClick={() => setCancelling(true)}>
                Cancel lesson
              </Button>
            </>
          )}
          {lesson.status === "completed" && note && (
            <Button variant="outline" className="h-11 active:scale-95 transition-transform" onClick={() => setFeedbackMode(true)}>
              {note.student_feedback ? "Edit feedback" : "Add feedback"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
