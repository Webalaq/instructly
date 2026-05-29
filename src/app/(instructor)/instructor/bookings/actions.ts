"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createBookingSchema, updateBookingSchema } from "@/lib/schemas/booking";

export async function createBooking(data: unknown) {
  const parsed = createBookingSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("bookings").insert({
    instructor_id: user.id,
    student_id: parsed.data.studentId,
    start_at: parsed.data.startAt,
    end_at: parsed.data.endAt,
    pickup_location: parsed.data.pickupLocation || null,
    price_pence: parsed.data.pricePence,
    status: "scheduled",
  });

  if (error) {
    if (error.code === "23P01") {
      return { error: "This time slot overlaps with an existing booking" };
    }
    return { error: "Failed to create booking" };
  }

  revalidatePath("/instructor/bookings");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/calendar");
  revalidatePath("/student/lessons");
  return { success: true };
}

export async function updateBooking(id: string, data: unknown) {
  const parsed = updateBookingSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid data", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("bookings")
    .update({
      student_id: parsed.data.studentId,
      start_at: parsed.data.startAt,
      end_at: parsed.data.endAt,
      pickup_location: parsed.data.pickupLocation || null,
      price_pence: parsed.data.pricePence,
      status: parsed.data.status,
      paid: parsed.data.paid ?? false,
      cancellation_reason: parsed.data.cancellationReason || null,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23P01") {
      return { error: "This time slot overlaps with an existing booking" };
    }
    return { error: "Failed to update booking" };
  }

  revalidatePath("/instructor/bookings");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/calendar");
  revalidatePath("/student/lessons");
  return { success: true };
}

export async function cancelBooking(id: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancellation_reason: reason || null,
    })
    .eq("id", id);

  if (error) return { error: "Failed to cancel booking" };

  revalidatePath("/instructor/bookings");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/calendar");
  revalidatePath("/student/lessons");
  return { success: true };
}

export async function completeBooking(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("bookings")
    .update({ status: "completed" })
    .eq("id", id);

  if (error) return { error: "Failed to complete booking" };

  revalidatePath("/instructor/bookings");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/calendar");
  revalidatePath("/student/lessons");
  return { success: true };
}
