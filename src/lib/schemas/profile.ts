import { z } from "zod/v3";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().or(z.literal("")),
  businessName: z.string().optional().or(z.literal("")),
  hourlyRatePounds: z.number().min(10, "Minimum £10").max(100, "Maximum £100").optional(),
  defaultLessonMinutes: z.number().optional(),
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;
