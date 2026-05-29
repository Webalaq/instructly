"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addStudentSchema, updateStudentSchema } from "@/lib/schemas/student";

export async function addStudent(data: unknown) {
  const parsed = addStudentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("students").insert({
    instructor_id: user.id,
    full_name: parsed.data.fullName,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    theory_passed: parsed.data.theoryPassed ?? false,
    test_date: parsed.data.testDate || null,
    notes: parsed.data.notes || null,
  });

  if (error) return { error: "Failed to add student" };

  revalidatePath("/instructor/students");
  return { success: true };
}

export async function updateStudent(id: string, data: unknown) {
  const parsed = updateStudentSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("students")
    .update({
      full_name: parsed.data.fullName,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      status: parsed.data.status,
      theory_passed: parsed.data.theoryPassed ?? false,
      test_date: parsed.data.testDate || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id);

  if (error) return { error: "Failed to update student" };

  revalidatePath("/instructor/students");
  return { success: true };
}

export async function softDeleteStudent(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("students")
    .update({ status: "inactive" })
    .eq("id", id);

  if (error) return { error: "Failed to archive student" };

  revalidatePath("/instructor/students");
  return { success: true };
}
