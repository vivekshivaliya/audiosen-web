import { normalizePhoneNumber } from "@/lib/enquiries/normalize";

type DeliveryStatus = "sent" | "not-configured" | "failed";

function indianE164(phone: string): string | null {
  const normalized = normalizePhoneNumber(phone);
  return /^\+91[6-9]\d{9}$/.test(normalized) ? normalized : null;
}

async function sendTwilioSms(phone: string): Promise<DeliveryStatus> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_SMS_FROM?.trim();
  const to = indianE164(phone);
  if (!accountSid || !authToken || !from || !to) return "not-configured";

  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: "Thank you for contacting Audiosen. We have received your enquiry and our team will contact you shortly. Call: 8923092563",
  });
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        signal: AbortSignal.timeout(8_000),
      },
    );
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

async function sendMetaWhatsApp(phone: string): Promise<DeliveryStatus> {
  const token = process.env.META_WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim();
  const templateName = process.env.META_WHATSAPP_TEMPLATE_NAME?.trim();
  const language = process.env.META_WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "en";
  const to = indianE164(phone);
  if (!token || !phoneNumberId || !templateName || !to) return "not-configured";

  try {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${encodeURIComponent(phoneNumberId)}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.slice(1),
          type: "template",
          template: { name: templateName, language: { code: language } },
        }),
        signal: AbortSignal.timeout(8_000),
      },
    );
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

/** Optional official-provider confirmations. Failures never affect enquiry acceptance. */
export async function sendOptionalPatientConfirmations(phone: string): Promise<{
  sms: DeliveryStatus;
  whatsapp: DeliveryStatus;
}> {
  const [sms, whatsapp] = await Promise.all([sendTwilioSms(phone), sendMetaWhatsApp(phone)]);
  return { sms, whatsapp };
}
