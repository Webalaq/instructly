import * as functions from "firebase-functions";
import { sendPushNotification } from "../notifications/send_push";

/**
 * Fires when a new booking document is created under
 * instructors/{instructorId}/bookings/{bookingId}.
 * Sends a "Lesson Booked" push notification to the student.
 */
export const onBookingCreated = functions.firestore
  .document("instructors/{instructorId}/bookings/{bookingId}")
  .onCreate(async (snapshot, context) => {
    const booking = snapshot.data();
    if (!booking) return;

    const { studentId, studentName, startTime } = booking;

    // Format start time for human-readable notification body
    let timeStr = "soon";
    if (startTime && startTime.toDate) {
      const dt: Date = startTime.toDate();
      timeStr = dt.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    await sendPushNotification({
      userId: studentId,
      title: "Lesson Booked",
      body: `Your driving lesson has been confirmed for ${timeStr}.`,
      type: "booking_confirmed",
      relatedId: context.params.bookingId,
    });

    console.log(
      `onBookingCreated: notified student=${studentName} (uid=${studentId}) ` +
        `for booking=${context.params.bookingId}`
    );
  });
