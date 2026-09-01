import type { EnquiryInput } from "@/lib/enquiries/schema";
import type { NormalizedEnquiry } from "@/lib/enquiries/normalize";
import {
  AUDIOSEN_PHONE_DISPLAY,
  AUDIOSEN_PHONE_E164,
  AUDIOSEN_ADDRESS,
  AUDIOSEN_URL,
  PATIENT_SUPPORT_EMAIL,
  STAFF_ENQUIRY_EMAIL,
} from "@/lib/enquiries/constants";

export type OutboxEmail = {
  kind: "STAFF_ENQUIRY" | "PATIENT_CONFIRMATION";
  dedupeKey: string;
  fromAddress: string;
  toAddress: string;
  replyToAddress?: string;
  subject: string;
  textBody: string;
  htmlBody: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function display(value: string | number | boolean | undefined): string {
  if (value === undefined || value === "") return "Not supplied";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function appUrl(): string {
  const configured = process.env.APP_URL?.trim();
  if (!configured) return AUDIOSEN_URL;

  try {
    const url = new URL(configured);
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") return AUDIOSEN_URL;
    return url.origin;
  } catch {
    return AUDIOSEN_URL;
  }
}

function phoneForHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return phone.trim().startsWith("+") ? `+${digits}` : digits;
}

function staffMessage(
  reference: string,
  input: EnquiryInput,
  normalized: NormalizedEnquiry,
  submittedAt: Date,
): OutboxEmail {
  const detailRows: Array<[string, string | number | boolean | undefined]> = [
    ["Enquiry ID", reference],
    ["Patient", input.name],
    ["Phone", input.phone],
    ["Email", input.email],
    ["Age", normalized.age],
    ["Age group", normalized.ageGroup],
    ["Guardian consent", input.guardianConsent],
    ["City", input.city],
    ["Service", input.service],
    ["Selected brand", normalized.selectedBrand],
    ["Selected device", normalized.selectedDevice],
    ["Hearing concern", normalized.hearingConcern ? "View in protected admin" : undefined],
    ["Message", input.message ? "View in protected admin" : undefined],
    ["Appointment date", normalized.appointmentDate],
    ["Appointment time", normalized.appointmentTime],
    ["Home visit", normalized.homeVisit],
    ["Source page", normalized.sourcePath],
    ["UTM source", input.attribution?.utmSource],
    ["UTM medium", input.attribution?.utmMedium],
    ["UTM campaign", input.attribution?.utmCampaign],
    ["Timestamp", submittedAt.toISOString()],
  ];
  const callHref = `tel:${phoneForHref(input.phone)}`;
  const whatsappHref = `https://wa.me/${input.phone.replace(/\D/g, "")}`;
  const leadHref = `${appUrl()}/admin/enquiries/${encodeURIComponent(reference)}`;
  const rows = detailRows
    .map(
      ([label, value]) =>
        `<tr><th style="padding:8px 10px;text-align:left;vertical-align:top;border-bottom:1px solid #e2e8f0">${escapeHtml(label)}</th><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${escapeHtml(display(value))}</td></tr>`,
    )
    .join("");

  return {
    kind: "STAFF_ENQUIRY",
    dedupeKey: `${reference}:staff`,
    fromAddress: `Audiosen <${PATIENT_SUPPORT_EMAIL}>`,
    toAddress: STAFF_ENQUIRY_EMAIL,
    replyToAddress: input.email || undefined,
    subject: `New Audiosen Enquiry — ${input.name}`,
    textBody: [
      "New Audiosen website enquiry",
      "",
      ...detailRows.map(([label, value]) => `${label}: ${display(value)}`),
      "",
      `Call patient: ${callHref}`,
      `WhatsApp patient: ${whatsappHref}`,
      `Open lead: ${leadHref}`,
    ].join("\n"),
    htmlBody: `<div style="font-family:Arial,sans-serif;max-width:760px;margin:auto;color:#0f172a"><h1 style="font-size:22px">New Audiosen enquiry</h1><table style="width:100%;border-collapse:collapse">${rows}</table><p style="margin-top:20px"><a href="${escapeHtml(callHref)}" style="display:inline-block;margin:4px;padding:10px 14px;background:#075985;color:white;text-decoration:none;border-radius:8px">Call Patient</a><a href="${escapeHtml(whatsappHref)}" style="display:inline-block;margin:4px;padding:10px 14px;background:#047857;color:white;text-decoration:none;border-radius:8px">WhatsApp Patient</a><a href="${escapeHtml(leadHref)}" style="display:inline-block;margin:4px;padding:10px 14px;background:#334155;color:white;text-decoration:none;border-radius:8px">Open Lead</a></p></div>`,
  };
}

function patientMessage(
  reference: string,
  input: EnquiryInput,
): OutboxEmail | undefined {
  if (!input.email) return undefined;
  const safeName = escapeHtml(input.name);
  const safeReference = escapeHtml(reference);
  const safeService = escapeHtml(input.service);

  return {
    kind: "PATIENT_CONFIRMATION",
    dedupeKey: `${reference}:patient`,
    fromAddress: `Audiosen <${PATIENT_SUPPORT_EMAIL}>`,
    toAddress: input.email,
    replyToAddress: PATIENT_SUPPORT_EMAIL,
    subject: "Thank You for Contacting Audiosen",
    textBody: [
      `Dear ${input.name},`,
      "",
      "Thank you for contacting Audiosen. Your enquiry has been received successfully.",
      `Enquiry reference: ${reference}`,
      `Requested service: ${input.service}`,
      "Our team will review your details and contact you.",
      "",
      `Phone: ${AUDIOSEN_PHONE_DISPLAY}`,
      `Clinic address: ${AUDIOSEN_ADDRESS}`,
      `Email: ${PATIENT_SUPPORT_EMAIL}`,
      `Website: ${AUDIOSEN_URL}`,
      "",
      "Warm regards,",
      "Audiosen Hearing Care",
    ].join("\n"),
    htmlBody: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#1e293b;border:1px solid #dbeafe;border-radius:16px;overflow:hidden"><div style="background:#075985;color:white;padding:22px 26px"><h1 style="margin:0;font-size:23px">Thank you for contacting Audiosen</h1></div><div style="padding:24px 26px;line-height:1.65"><p>Dear ${safeName},</p><p>Your enquiry has been received successfully. Our team will contact you shortly.</p><p><strong>Enquiry reference:</strong> ${safeReference}<br><strong>Requested service:</strong> ${safeService}</p><p><strong>Phone:</strong> <a href="tel:${AUDIOSEN_PHONE_E164}">${AUDIOSEN_PHONE_DISPLAY}</a><br><strong>Clinic address:</strong> ${escapeHtml(AUDIOSEN_ADDRESS)}<br><strong>Email:</strong> <a href="mailto:${PATIENT_SUPPORT_EMAIL}">${PATIENT_SUPPORT_EMAIL}</a><br><strong>Website:</strong> <a href="${AUDIOSEN_URL}">${AUDIOSEN_URL}</a></p><p>Warm regards,<br><strong>Audiosen Advance Hearing Care Solutions</strong></p></div></div>`,
  };
}

export function buildOutboxEmails(
  reference: string,
  input: EnquiryInput,
  normalized: NormalizedEnquiry,
  submittedAt: Date,
): OutboxEmail[] {
  const patient = patientMessage(reference, input);
  return [staffMessage(reference, input, normalized, submittedAt), ...(patient ? [patient] : [])];
}
