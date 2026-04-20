import * as functions from "firebase-functions";
import { sendPushNotification } from "../notifications/send_push";

/**
 * Fires when a booking document is updated under
 * instructors/{instructorId}/bookings/{bookingId}.
 * Sends "Lesson Cancelled" or "Lesson Completed" notifications on status changes.
 */
export const onBookingUpdated = functions.firestore
  .document("instructors/{instructorId}/bookings/{bookingId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!before || !after) return;

    const prevStatus: string = before.status ?? "";
    const newStatus: string = after.status ?? "";

    // Only act on status changes
    if (prevStatus === newStatus) return;

    const { studentId, studentName } = after;
    const bookingId: string = context.params.bookingId;

    if (newStatus === "cancelled") {
      const reason: string | undefined = after.cancellationReason;
      const isLate: boolean = after.lateCancellation ?? false;

      await sendPushNotification({
        userId: studentId,
        title: "Lesson Cancelled",
        body: isLate
          ? `Your lesson has been cancelled with less than 24 hours notice.${reason ? ` Reason: ${reason}` : ""}`
          : `Your driving lesson has been cancelled.${reason ? ` Reason: ${reason}` : ""}`,
        type: "cancelled",
        relatedId: bookingId,
      });

      console.log(
        `onBookingUpdated: cancellation notification sent to student=${studentName} (uid=${studentId})`
      );
    } else if (newStatus === "completed") {
      await sendPushNotification({
        userId: studentId,
        title: "Lesson Completed",
        body: "Great work! Your driving lesson has been marked as completed.",
        type: "completed",
        relatedId: bookingId,
      });

      console.log(
        `onBookingUpdated: completion notification sent to student=${studentName} (uid=${studentId})`
      );
    }
  });
