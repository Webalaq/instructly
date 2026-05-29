import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/twilio/send";

// Service role client for reading bookings across all instructors
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();

  // Find bookings starting 23–25 hours from now (window for cron timing)
  const now = new Date();
  const from = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id,
      start_at,
      students(full_name, phone),
      instructor_id
    `)
    .eq("status", "scheduled")
    .gte("start_at", from.toISOString())
    .lte("start_at", to.toISOString());

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Check which bookings already have a reminder sent
  const bookingIds = bookings.map((b) => b.id);
  const { data: existing } = await supabase
    .from("whatsapp_messages")
    .select("booking_id")
    .in("booking_id", bookingIds)
    .eq("template_key", "reminder_24h")
    .in("status", ["queued", "sent", "delivered"]);

  const alreadySent = new Set((existing ?? []).map((e) => e.booking_id));

  let sentCount = 0;

  for (const booking of bookings) {
    if (alreadySent.has(booking.id)) continue;

    const student = Array.isArray(booking.students) ? booking.students[0] : booking.students;
    if (!student?.phone) continue;

    // Get instructor name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", booking.instructor_id)
      .single();

    await sendWhatsAppMessage({
      bookingId: booking.id,
      recipientPhone: student.phone,
      templateKey: "reminder_24h",
      studentName: student.full_name,
      instructorName: profile?.full_name ?? "your instructor",
      startAt: booking.start_at,
    });

    sentCount++;
  }

  return NextResponse.json({ sent: sentCount });
}
