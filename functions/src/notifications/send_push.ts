import * as admin from "firebase-admin";

export interface PushPayload {
  userId: string;
  title: string;
  body: string;
  type: string;
  relatedId?: string;
}

/**
 * Retrieves the FCM token for a user, sends a push notification,
 * and stores the notification document in /users/{userId}/notifications.
 */
export async function sendPushNotification(
  payload: PushPayload
): Promise<void> {
  const { userId, title, body, type, relatedId } = payload;

  const db = admin.firestore();

  // Get FCM token from /users/{userId}
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    console.warn(`sendPush: user document not found for uid=${userId}`);
    return;
  }

  const fcmToken = userDoc.data()?.fcmToken as string | undefined;

  if (fcmToken) {
    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: { title, body },
        data: {
          type,
          ...(relatedId ? { relatedId } : {}),
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
        android: {
          priority: "high",
          notification: { sound: "default" },
        },
      });
    } catch (err) {
      console.error(`sendPush: FCM send failed for uid=${userId}:`, err);
    }
  } else {
    console.warn(`sendPush: no FCM token for uid=${userId}`);
  }

  // Always store the notification in Firestore regardless of FCM delivery
  await db.collection("users").doc(userId).collection("notifications").add({
    type,
    title,
    body,
    ...(relatedId ? { relatedId } : {}),
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
