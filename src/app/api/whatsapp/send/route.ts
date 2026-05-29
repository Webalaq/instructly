import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage } from "@/lib/twilio/send";
import type { TemplateKey } from "@/lib/twilio/templates";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { bookingId, templateKey } = body as {
    bookingId: string;
    templateKey: TemplateKey;
  };

  if (!bookingId || !templateKey) {
    return NextResponse.json({ error: "Missing bookingId or templateKey" }, { status: 400 });
  }

  // Get booking with student details
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, start_at, instructor_id, students(full_name, phone)")
    .eq("id", bookingId)
    .single();

  if (!booking || booking.instructor_id !== user.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const student = Array.isArray(booking.students) ? booking.students[0] : booking.students;
  if (!student?.phone) {
    return NextResponse.json({ error: "Student has no phone number" }, { status: 400 });
  }

  const result = await sendWhatsAppMessage({
    bookingId: booking.id,
    recipientPhone: student.phone,
    templateKey,
    studentName: student.full_name,
    instructorName: user.user_metadata?.full_name ?? "your instructor",
    startAt: booking.start_at,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
