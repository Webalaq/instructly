"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addRecurringSlot(data: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("availability_slots").insert({
    instructor_id: user.id,
    type: "recurring",
    day_of_week: data.dayOfWeek,
    start_time: data.startTime,
    end_time: data.endTime,
  });

  if (error) return { error: "Failed to add slot" };

  revalidatePath("/instructor/availability");
  return { success: true };
}

export async function addBlockedDate(data: {
  date: string;
  reason?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("availability_slots").insert({
    instructor_id: user.id,
    type: "blocked",
    date: data.date,
    start_at: `${data.date}T00:00:00Z`,
    end_at: `${data.date}T23:59:59Z`,
  });

  if (error) return { error: "Failed to block date" };

  revalidatePath("/instructor/availability");
  return { success: true };
}

export async function deleteSlot(slotId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("availability_slots")
    .delete()
    .eq("id", slotId)
    .eq("instructor_id", user.id);

  if (error) return { error: "Failed to delete slot" };

  revalidatePath("/instructor/availability");
  return { success: true };
}
