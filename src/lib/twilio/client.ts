import twilio from "twilio";

export function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN");
  }

  return twilio(accountSid, authToken);
}

export function getWhatsAppFrom() {
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) throw new Error("Missing TWILIO_WHATSAPP_FROM");
  return from;
}
