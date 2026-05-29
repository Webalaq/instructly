import { createClient } from "@supabase/supabase-js";
import type { NotificationData, SendResult } from "./types";
import { sendEmail } from "./channels/email";
import { sendPush } from "./channels/push";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function sendNotification(notification: NotificationData): Promise<SendResult> {
  if (!notification.recipientEmail) {
    const supabase = getServiceClient();
    const { data } = await supabase.auth.admin.getUserById(notification.recipientUserId);
    notification.recipientEmail = data?.user?.email ?? undefined;
  }

  const [emailResult, pushResult] = await Promise.allSettled([
    notification.recipientEmail
      ? sendEmail(notification)
      : Promise.resolve("skipped" as const),
    sendPush(notification),
  ]);

  return {
    email: emailResult.status === "fulfilled" ? emailResult.value : "failed",
    push: pushResult.status === "fulfilled" ? pushResult.value : "failed",
  };
}
