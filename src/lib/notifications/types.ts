export type NotificationEvent =
  | "welcome"
  | "booking_confirmation"
  | "reminder_24h"
  | "cancellation"
  | "reschedule_request"
  | "reschedule_response"
  | "lesson_completed";

export type NotificationData = {
  recipientUserId: string;
  recipientEmail?: string;
  event: NotificationEvent;
  bookingId?: string;
  data: {
    studentName?: string;
    instructorName?: string;
    date?: string;
    time?: string;
    oldDate?: string;
    oldTime?: string;
    newDate?: string;
    newTime?: string;
    status?: "accepted" | "declined";
    actionUrl?: string;
  };
};

export type SendResult = {
  email: "sent" | "failed" | "skipped";
  push: "sent" | "failed" | "skipped";
};
