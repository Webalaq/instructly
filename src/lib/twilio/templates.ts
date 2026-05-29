import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TZ = "Europe/London";

export type TemplateKey = "reminder_24h" | "cancellation" | "booking_confirmation";

interface TemplateParams {
  studentName: string;
  instructorName: string;
  date: string;
  time: string;
}

function formatBookingTime(startAt: string): { date: string; time: string } {
  const zonedDate = toZonedTime(parseISO(startAt), TZ);
  return {
    date: format(zonedDate, "EEEE d MMMM"),
    time: format(zonedDate, "HH:mm"),
  };
}

const TEMPLATES: Record<TemplateKey, (p: TemplateParams) => string> = {
  reminder_24h: (p) =>
    `Hi ${p.studentName}, this is a reminder that you have a driving lesson with ${p.instructorName} tomorrow (${p.date}) at ${p.time}. See you then!`,
  cancellation: (p) =>
    `Hi ${p.studentName}, your driving lesson with ${p.instructorName} on ${p.date} at ${p.time} has been cancelled. Please contact your instructor to reschedule.`,
  booking_confirmation: (p) =>
    `Hi ${p.studentName}, your driving lesson with ${p.instructorName} has been booked for ${p.date} at ${p.time}. Good luck!`,
};

export function renderTemplate(
  key: TemplateKey,
  opts: { studentName: string; instructorName: string; startAt: string }
): string {
  const { date, time } = formatBookingTime(opts.startAt);
  return TEMPLATES[key]({ ...opts, date, time });
}
