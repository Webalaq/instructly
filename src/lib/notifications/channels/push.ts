import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import type { NotificationData } from "../types";
import { getPushContent } from "../templates/push";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function initVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(
    "mailto:notifications@instructly.app",
    publicKey,
    privateKey
  );
  return true;
}

export async function sendPush(notification: NotificationData): Promise<"sent" | "skipped" | "failed"> {
  const content = getPushContent(notification.event, notification.data);
  if (!content) return "skipped";

  if (!initVapid()) return "skipped";

  const supabase = getServiceClient();

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", notification.recipientUserId);

  if (!subscriptions || subscriptions.length === 0) return "skipped";

  const payload = JSON.stringify({
    title: content.title,
    body: content.body,
    url: content.url,
    icon: "/icon-192.png",
  });

  let anySent = false;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
      anySent = true;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", sub.endpoint);
      }
    }
  }

  return anySent ? "sent" : "failed";
}
