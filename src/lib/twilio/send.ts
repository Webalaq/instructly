import { createClient } from "@supabase/supabase-js";
import { getTwilioClient, getWhatsAppFrom } from "./client";
import { renderTemplate, type TemplateKey } from "./templates";

// Use service role for writing to whatsapp_messages (RLS blocks authenticated users)
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey);
}

export async function sendWhatsAppMessage(opts: {
  bookingId: string | null;
  recipientPhone: string;
  templateKey: TemplateKey;
  studentName: string;
  instructorName: string;
  startAt: string;
}) {
  const body = renderTemplate(opts.templateKey, {
    studentName: opts.studentName,
    instructorName: opts.instructorName,
    startAt: opts.startAt,
  });

  const supabase = getServiceClient();

  // Insert queued record
  const { data: msgRecord, error: insertError } = await supabase
    .from("whatsapp_messages")
    .insert({
      booking_id: opts.bookingId,
      recipient_phone: opts.recipientPhone,
      template_key: opts.templateKey,
      status: "queued",
    })
    .select("id")
    .single();

  if (insertError || !msgRecord) {
    return { error: "Failed to queue message" };
  }

  try {
    const client = getTwilioClient();
    const message = await client.messages.create({
      from: `whatsapp:${getWhatsAppFrom()}`,
      to: `whatsapp:${opts.recipientPhone}`,
      body,
    });

    await supabase
      .from("whatsapp_messages")
      .update({
        status: "sent",
        twilio_sid: message.sid,
        sent_at: new Date().toISOString(),
      })
      .eq("id", msgRecord.id);

    return { success: true, sid: message.sid };
  } catch (err) {
    await supabase
      .from("whatsapp_messages")
      .update({ status: "failed" })
      .eq("id", msgRecord.id);

    return { error: err instanceof Error ? err.message : "Send failed" };
  }
}
