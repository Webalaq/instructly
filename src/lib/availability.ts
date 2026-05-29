import {
  addDays,
  parseISO,
  format,
  isBefore,
  isAfter,
} from "date-fns";

export type RecurringSlot = {
  day_of_week: number; // 0=Sun, 6=Sat
  start_time: string;  // "HH:mm"
  end_time: string;    // "HH:mm"
};

export type BlockedDate = string; // "YYYY-MM-DD"

export type ExistingBooking = {
  start_at: string; // ISO timestamp
  end_at: string;   // ISO timestamp
};

export type TimeSlot = {
  start: string; // ISO timestamp
  end: string;   // ISO timestamp
};

function utcDate(dateStr: string, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  return new Date(`${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`);
}

function addMinutesUTC(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function computeAvailableSlots(opts: {
  recurring: RecurringSlot[];
  blocked: BlockedDate[];
  bookings: ExistingBooking[];
  startDate: string;       // "YYYY-MM-DD"
  endDate: string;         // "YYYY-MM-DD"
  durationMinutes: number; // 60, 90, or 120
}): TimeSlot[] {
  const { recurring, blocked, bookings, startDate, endDate, durationMinutes } = opts;
  const blockedSet = new Set(blocked);
  const now = new Date();
  const slots: TimeSlot[] = [];

  let current = parseISO(startDate);
  const end = parseISO(endDate);

  while (!isAfter(current, end)) {
    const dateStr = format(current, "yyyy-MM-dd");
    const dayOfWeek = current.getDay();

    if (!blockedSet.has(dateStr)) {
      const daySlots = recurring.filter((r) => r.day_of_week === dayOfWeek);

      for (const avail of daySlots) {
        let slotStart = utcDate(dateStr, avail.start_time);
        const availEnd = utcDate(dateStr, avail.end_time);

        while (true) {
          const slotEnd = addMinutesUTC(slotStart, durationMinutes);

          if (isAfter(slotEnd, availEnd)) break;

          if (isAfter(slotStart, now)) {
            const hasConflict = bookings.some((b) => {
              const bStart = parseISO(b.start_at);
              const bEnd = parseISO(b.end_at);
              return isBefore(slotStart, bEnd) && isAfter(slotEnd, bStart);
            });

            if (!hasConflict) {
              slots.push({
                start: slotStart.toISOString(),
                end: slotEnd.toISOString(),
              });
            }
          }

          slotStart = addMinutesUTC(slotStart, 30);
        }
      }
    }

    current = addDays(current, 1);
  }

  return slots;
}
