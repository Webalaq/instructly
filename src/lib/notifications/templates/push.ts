import type { NotificationEvent, NotificationData } from "../types";

type PushContent = {
  title: string;
  body: string;
  url: string;
};

export function getPushContent(event: NotificationEvent, data: NotificationData["data"]): PushContent | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  switch (event) {
    case "booking_confirmation":
      return {
        title: "Lesson Booked",
        body: `${data.date ?? "Upcoming"} at ${data.time ?? "TBC"}`,
        url: `${appUrl}/student/calendar`,
      };
    case "reminder_24h":
      return {
        title: "Lesson Tomorrow",
        body: `${data.time ?? "Check your calendar"} with ${data.instructorName ?? "your instructor"}`,
        url: `${appUrl}/student/calendar`,
      };
    case "cancellation":
      return {
        title: "Lesson Cancelled",
        body: `${data.date ?? "Your lesson"} at ${data.time ?? "the scheduled time"}`,
        url: `${appUrl}/student/lessons`,
      };
    case "reschedule_request":
      return {
        title: "Reschedule Request",
        body: `${data.studentName ?? data.instructorName ?? "Someone"} wants to change your lesson time`,
        url: data.actionUrl ?? `${appUrl}/student/requests`,
      };
    default:
      return null;
  }
}
