import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AvailabilitySlot } from "@/lib/schemas/booking";
import AvailabilityManager from "./AvailabilityManager";

export default async function AvailabilityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "instructor") redirect("/login");

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("instructor_id", user.id)
    .order("day_of_week")
    .order("start_time");

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold md:text-2xl">Availability</h1>
        <p className="text-sm text-muted-foreground">
          Set your working hours and block days off.
        </p>
      </div>
      <AvailabilityManager slots={(slots ?? []) as AvailabilitySlot[]} />
    </div>
  );
}
