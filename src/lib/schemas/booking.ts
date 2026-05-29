import { z } from "zod/v3";

export const createBookingSchema = z.object({
  studentId: z.string().uuid("Select a student"),
  startAt: z.string().min(1, "Start time is required"),
  endAt: z.string().min(1, "End time is required"),
  pickupLocation: z.string().optional().or(z.literal("")),
  pricePence: z.number().int().min(0),
});

export type CreateBookingValues = z.infer<typeof createBookingSchema>;

export const updateBookingSchema = createBookingSchema.extend({
  status: z.enum(["scheduled", "completed", "cancelled", "no_show"]),
  cancellationReason: z.string().optional().or(z.literal("")),
  paid: z.boolean().optional().default(false),
});

export type UpdateBookingValues = z.infer<typeof updateBookingSchema>;

export type Booking = {
  id: string;
  instructor_id: string;
  student_id: string;
  start_at: string;
  end_at: string;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  pickup_location: string | null;
  price_pence: number;
  paid: boolean;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  students?: {
    id: string;
    full_name: string;
  };
};

export const availabilitySlotSchema = z.object({
  type: z.enum(["recurring", "one_off", "blocked"]),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  date: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
});

export type AvailabilitySlotValues = z.infer<typeof availabilitySlotSchema>;

export type AvailabilitySlot = {
  id: string;
  instructor_id: string;
  type: "recurring" | "one_off" | "blocked";
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
  date: string | null;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
};
