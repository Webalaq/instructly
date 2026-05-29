import { z } from "zod/v3";

export const lessonRequestSchema = z.object({
  proposedStartAt: z.string().min(1, "Select a time slot"),
  proposedEndAt: z.string().min(1),
  durationMinutes: z.number().int().refine((v) => [60, 90, 120].includes(v), "Invalid duration"),
  message: z.string().max(500).optional().or(z.literal("")),
});

export type LessonRequestValues = z.infer<typeof lessonRequestSchema>;

export const rescheduleRequestSchema = lessonRequestSchema.extend({
  bookingId: z.string().uuid("Invalid booking"),
});

export type RescheduleRequestValues = z.infer<typeof rescheduleRequestSchema>;
