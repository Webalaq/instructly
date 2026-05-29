import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { render } from "@react-email/components";
import React from "react";
import type { NotificationData } from "../types";
import { WelcomeEmail } from "../templates/email/welcome";
import { BookingConfirmationEmail } from "../templates/email/booking-confirmation";
import { ReminderEmail } from "../templates/email/reminder";
import { CancellationEmail } from "../templates/email/cancellation";
import { RescheduleRequestEmail } from "../templates/email/reschedule-request";
import { RescheduleResponseEmail } from "../templates/email/reschedule-response";
import { LessonCompletedEmail } from "../templates/email/lesson-completed";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const SUBJECT_MAP: Record<string, string> = {
  welcome: "Welcome to Instructly!",
  booking_confirmation: "Lesson Booked",
  reminder_24h: "Lesson Tomorrow — Reminder",
  cancellation: "Lesson Cancelled",
  reschedule_request: "Reschedule Request",
  reschedule_response: "Reschedule Update",
  lesson_completed: "Lesson Complete — Notes Available",
};

function renderEmailTemplate(
  event: NotificationData["event"],
  data: NotificationData["data"]
): React.ReactElement {
  switch (event) {
    case "welcome":
      return React.createElement(WelcomeEmail, {
        studentName: data.studentName ?? "there",
        instructorName: data.instructorName ?? "your instructor",
      });

    case "booking_confirmation":
      return React.createElement(BookingConfirmationEmail, {
        studentName: data.studentName ?? "there",
        instructorName: data.instructorName ?? "your instructor",
        date: data.date ?? "",
        time: data.time ?? "",
      });

    case "reminder_24h":
      return React.createElement(ReminderEmail, {
        studentName: data.studentName ?? "there",
        instructorName: data.instructorName ?? "your instructor",
        date: data.date ?? "",
        time: data.time ?? "",
      });

    case "cancellation":
      return React.createElement(CancellationEmail, {
        studentName: data.studentName ?? "there",
        instructorName: data.instructorName ?? "your instructor",
        date: data.date ?? "",
        time: data.time ?? "",
      });

    case "reschedule_request":
      return React.createElement(RescheduleRequestEmail, {
        studentName: data.studentName ?? "there",
        requesterName: data.instructorName ?? data.studentName ?? "Someone",
        oldDate: data.oldDate ?? "",
        oldTime: data.oldTime ?? "",
        newDate: data.newDate ?? "",
        newTime: data.newTime ?? "",
        actionUrl: data.actionUrl,
      });

    case "reschedule_response":
      return React.createElement(RescheduleResponseEmail, {
        studentName: data.studentName ?? "there",
        status: data.status ?? "declined",
        newDate: data.newDate ?? "",
        newTime: data.newTime ?? "",
        oldDate: data.oldDate ?? "",
        oldTime: data.oldTime ?? "",
      });

    case "lesson_completed":
      return React.createElement(LessonCompletedEmail, {
        studentName: data.studentName ?? "there",
        instructorName: data.instructorName ?? "your instructor",
        date: data.date ?? "",
        actionUrl: data.actionUrl,
      });
  }
}

export async function sendEmail(notification: NotificationData): Promise<"sent" | "failed"> {
  if (!notification.recipientEmail) return "failed";

  const supabase = getServiceClient();
  const subject = SUBJECT_MAP[notification.event] ?? "Notification from Instructly";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "Instructly <noreply@instructly.co.uk>";

  const { data: record, error: insertError } = await supabase
    .from("email_messages")
    .insert({
      recipient_email: notification.recipientEmail,
      template_key: notification.event,
      status: "queued",
      booking_id: notification.bookingId ?? null,
    })
    .select("id")
    .single();

  if (insertError || !record) {
    console.error("[sendEmail] failed to insert email_messages record", insertError);
    return "failed";
  }

  const messageId = record.id as string;

  try {
    const element = renderEmailTemplate(notification.event, notification.data);
    const html = await render(element);
    const resend = getResend();

    const { data: sent, error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: notification.recipientEmail,
      subject,
      html,
    });

    if (sendError || !sent) {
      throw sendError ?? new Error("Resend returned no data");
    }

    await supabase
      .from("email_messages")
      .update({ status: "sent", resend_id: sent.id, sent_at: new Date().toISOString() })
      .eq("id", messageId);

    return "sent";
  } catch (err) {
    console.error("[sendEmail] send failed", err);
    await supabase.from("email_messages").update({ status: "failed" }).eq("id", messageId);
    return "failed";
  }
}
