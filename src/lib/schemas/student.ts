import { z } from "zod/v3";

export const addStudentSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  theoryPassed: z.boolean().optional().default(false),
  testDate: z.string().optional().or(z.literal("")),
  notes: z
    .string()
    .max(500, "Notes must be under 500 characters")
    .optional()
    .or(z.literal("")),
});

export type AddStudentValues = z.infer<typeof addStudentSchema>;

export const updateStudentSchema = addStudentSchema.extend({
  status: z.enum(["active", "inactive", "passed", "test_booked"]),
});

export type UpdateStudentValues = z.infer<typeof updateStudentSchema>;

export type Student = {
  id: string;
  instructor_id: string;
  profile_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: "active" | "inactive" | "passed" | "test_booked";
  theory_passed: boolean;
  test_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
