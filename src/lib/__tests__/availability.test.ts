import { describe, it, expect } from "vitest";
import { computeAvailableSlots, type RecurringSlot, type BlockedDate, type ExistingBooking } from "@/lib/availability";

describe("computeAvailableSlots", () => {
  // June 2026: Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=7
  const recurring: RecurringSlot[] = [
    { day_of_week: 1, start_time: "09:00", end_time: "17:00" }, // Monday
    { day_of_week: 3, start_time: "09:00", end_time: "17:00" }, // Wednesday
  ];

  it("returns slots only on available days", () => {
    // June 7 = Sunday, June 8 = Monday, June 9 = Tuesday
    const slots = computeAvailableSlots({
      recurring,
      blocked: [],
      bookings: [],
      startDate: "2026-06-07", // Sunday
      endDate: "2026-06-09",   // Tuesday
      durationMinutes: 60,
    });

    // Should only have Monday (June 8) slots
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((s) => s.start.startsWith("2026-06-08"))).toBe(true);
  });

  it("excludes blocked dates", () => {
    // Block Monday June 1, Wednesday June 3 should still have slots
    const blocked: BlockedDate[] = ["2026-06-01"];
    const slots = computeAvailableSlots({
      recurring,
      blocked,
      bookings: [],
      startDate: "2026-06-01",
      endDate: "2026-06-04",
      durationMinutes: 60,
    });

    expect(slots.some((s) => s.start.startsWith("2026-06-01"))).toBe(false);
    expect(slots.some((s) => s.start.startsWith("2026-06-03"))).toBe(true);
  });

  it("excludes times that overlap with existing bookings", () => {
    // Monday June 1 with 9-10am booked
    const bookings: ExistingBooking[] = [
      { start_at: "2026-06-01T09:00:00.000Z", end_at: "2026-06-01T10:00:00.000Z" },
    ];
    const slots = computeAvailableSlots({
      recurring,
      blocked: [],
      bookings,
      startDate: "2026-06-01",
      endDate: "2026-06-01",
      durationMinutes: 60,
    });

    // 09:00 and 09:30 slots should be excluded (both overlap with booking)
    const slot9am = slots.find((s) => s.start.includes("T09:00:00"));
    const slot930 = slots.find((s) => s.start.includes("T09:30:00"));
    expect(slot9am).toBeUndefined();
    expect(slot930).toBeUndefined();
    // 10:00 slot should exist
    expect(slots.some((s) => s.start.includes("T10:00:00"))).toBe(true);
  });

  it("handles different duration lengths", () => {
    // Monday June 1
    const slots60 = computeAvailableSlots({
      recurring,
      blocked: [],
      bookings: [],
      startDate: "2026-06-01",
      endDate: "2026-06-01",
      durationMinutes: 60,
    });
    const slots120 = computeAvailableSlots({
      recurring,
      blocked: [],
      bookings: [],
      startDate: "2026-06-01",
      endDate: "2026-06-01",
      durationMinutes: 120,
    });

    // 2h slots should be fewer (can't start as late)
    expect(slots60.length).toBeGreaterThan(0);
    expect(slots120.length).toBeGreaterThan(0);
    expect(slots120.length).toBeLessThan(slots60.length);
  });

  it("returns empty for past dates", () => {
    const slots = computeAvailableSlots({
      recurring,
      blocked: [],
      bookings: [],
      startDate: "2020-01-06", // past Monday
      endDate: "2020-01-06",
      durationMinutes: 60,
    });

    expect(slots.length).toBe(0);
  });
});
