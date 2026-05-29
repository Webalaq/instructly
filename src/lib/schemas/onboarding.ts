import { z } from "zod/v3";

const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const timeSlotSchema = z
  .object({
    start: z.string().regex(TIME_RE, "Use HH:MM format"),
    end: z.string().regex(TIME_RE, "Use HH:MM format"),
  })
  .refine((slot) => slot.end > slot.start, {
    message: "End time must be after start time",
  });

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export const lessonPricingSchema = z.object({
  hourlyRatePounds: z.coerce
    .number()
    .min(10, "Minimum rate is £10")
    .max(100, "Maximum rate is £100"),
  defaultLessonMinutes: z.coerce
    .number()
    .refine((v) => [60, 90, 120].includes(v), "Choose 60, 90, or 120 minutes"),
  businessName: z.string().max(100).optional().or(z.literal("")),
});

export type LessonPricingValues = z.infer<typeof lessonPricingSchema>;

export const workingHoursSchema = z
  .object({
    workingHours: z.record(
      z.enum(DAYS),
      z.array(timeSlotSchema)
    ),
  })
  .refine(
    (data) =>
      Object.values(data.workingHours).some(
        (slots) => slots && slots.length > 0
      ),
    { message: "Select at least one working day", path: ["workingHours"] }
  );

export type WorkingHoursValues = z.infer<typeof workingHoursSchema>;

export const teachingAreaSchema = z.object({
  postcodes: z
    .array(z.string().regex(UK_POSTCODE_RE, "Invalid UK postcode"))
    .min(1, "Add at least one postcode"),
});

export type TeachingAreaValues = z.infer<typeof teachingAreaSchema>;

export const onboardingSchema = lessonPricingSchema
  .merge(workingHoursSchema.innerType())
  .merge(teachingAreaSchema);

export type OnboardingValues = z.infer<typeof onboardingSchema>;

export { UK_POSTCODE_RE };
