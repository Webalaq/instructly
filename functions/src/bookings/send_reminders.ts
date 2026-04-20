import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { sendPushNotification } from "../notifications/send_push";

/**
 * Scheduled function that runs every hour.
 * Queries all confirmed upcoming bookings across all instructors and sends:
 *   - A 24-hour reminder if the lesson starts in 23–25 hours
 *   - A 2-hour reminder  if the lesson starts in 1–3 hours
 * Tracks sent state via `reminder24hSent` and `reminder2hSent` fields
 * on the booking document to avoid duplicate sends.
 */
export const sendReminders = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async (_context) => {
    const db = admin.firestore();
    const now = new Date();

    // Windows for 24h reminder: lessons starting 23–25 h from now
    const window24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const window24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Windows for 2h reminder: lessons starting 1–3 h from now
    const window2hStart = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const window2hEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    // Collect all instructors
    const instructorsSnap = await db.collection("instructors").get();

    const reminderJobs: Promise<void>[] = [];

    for (const instructorDoc of instructorsSnap.docs) {
      const instructorId = instructorDoc.id;
      const bookingsRef = db
        .collection("instructors")
        .doc(instructorId)
        .collection("bookings");

      // --- 24h reminders ---
      const snap24h = await bookingsRef
        .where("status", "==", "confirmed")
        .where("startTime", ">=", window24hStart)
        .where("startTime", "<", window24hEnd)
        .where("reminder24hSent", "!=", true)
        .get();

      for (const doc of snap24h.docs) {
        const booking = doc.data();
        const studentId: string = booking.studentId;

        let timeStr = "tomorrow";
        if (booking.startTime?.toDate) {
          const dt: Date = booking.startTime.toDate();
          timeStr = dt.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        reminderJobs.push(
          (async () => {
            await sendPushNotification({
              userId: studentId,
              title: "Lesson Reminder",
              body: `Don't forget — your driving lesson is tomorrow at ${timeStr}.`,
              type: "reminder",
              relatedId: doc.id,
            });
            await doc.ref.update({ reminder24hSent: true });
          })()
        );
      }

      // --- 2h reminders ---
      const snap2h = await bookingsRef
        .where("status", "==", "confirmed")
        .where("startTime", ">=", window2hStart)
        .where("startTime", "<", window2hEnd)
        .where("reminder2hSent", "!=", true)
        .get();

      for (const doc of snap2h.docs) {
        const booking = doc.data();
        const studentId: string = booking.studentId;

        let timeStr = "soon";
        if (booking.startTime?.toDate) {
          const dt: Date = booking.startTime.toDate();
          timeStr = dt.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        reminderJobs.push(
          (async () => {
            await sendPushNotification({
              userId: studentId,
              title: "Lesson in 2 Hours",
              body: `Your driving lesson starts at ${timeStr}. See you soon!`,
              type: "reminder",
              relatedId: doc.id,
            });
            await doc.ref.update({ reminder2hSent: true });
          })()
        );
      }
    }

    await Promise.all(reminderJobs);
    console.log(
      `sendReminders: processed ${reminderJobs.length} reminder(s) at ${now.toISOString()}`
    );
  });
