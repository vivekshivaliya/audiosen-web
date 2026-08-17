import { NextRequest, NextResponse } from "next/server";
import { clinicContact } from "@/lib/content";
import {
  EnquiryStorageConfigurationError,
  EnquiryStorageUnavailableError,
  type EnquiryDeliveryUpdate,
  type SavedEnquiry,
  saveEnquiry,
  updateEnquiryDelivery,
} from "@/lib/enquiry-store";
import { mailConfig, sendMail } from "@/lib/mailer";
import { getClientKey, isRateLimited } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validation";

export const runtime = "nodejs";

const CONSENT_VERSION = "contact-privacy-v1-2026-08-17";

function extractIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return getClientKey(forwarded || realIp || "unknown");
}

function getMailErrorMessage(error: unknown): string {
  const candidate = error as { code?: string; responseCode?: number } | undefined;

  if (candidate?.code === "EAUTH" || candidate?.responseCode === 535) {
    return "The email notification service could not authenticate.";
  }

  return "The email notification service is temporarily unavailable.";
}

function deliveryErrorCode(error: unknown): string {
  const candidate = error as
    | { code?: string; responseCode?: number; name?: string }
    | undefined;

  return [candidate?.name, candidate?.code, candidate?.responseCode]
    .filter(Boolean)
    .join(":")
    .slice(0, 200) || "unknown";
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pagePath(value: string | undefined, fallback = "/"): string {
  if (!value) return fallback;

  try {
    return new URL(value, "https://audiosen.com").pathname.slice(0, 500) || fallback;
  } catch {
    return fallback;
  }
}

async function recordDeliverySafely(
  enquiry: SavedEnquiry,
  update: EnquiryDeliveryUpdate,
): Promise<void> {
  try {
    await updateEnquiryDelivery(enquiry, update);
  } catch (error) {
    console.error("Lead delivery status update failed:", error);
  }
}

export async function POST(request: NextRequest) {
  const ipKey = extractIp(request);
  if (isRateLimited(ipKey)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const {
    name,
    email = "",
    phone,
    city,
    language = "",
    serviceNeeded,
    preferredChannel = "",
    preferredCallbackTime = "",
    leadSource = "website_contact_form",
    message = "",
    consent,
    landingPage: submittedLandingPage = "",
    sourcePage: submittedSourcePage = "",
    utmSource = "",
    utmMedium = "",
    utmCampaign = "",
    utmTerm = "",
    utmContent = "",
    gclid = "",
    gbraid = "",
    wbraid = "",
    msclkid = "",
    fbclid = "",
    website = "",
  } = parsed.data;

  // Honeypot: report success without storing or notifying so bots cannot probe it.
  if (website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const submittedAt = new Date().toISOString();
  const consentAt = submittedAt;
  const referrerPath = pagePath(request.headers.get("referer") || undefined);
  const sourcePage = pagePath(submittedSourcePage, referrerPath);
  const landingPage = pagePath(submittedLandingPage, sourcePage);

  let savedEnquiry: SavedEnquiry;

  try {
    savedEnquiry = await saveEnquiry({
      submittedAt,
      status: "new",
      name,
      email,
      phone,
      city,
      language,
      serviceNeeded,
      preferredChannel,
      preferredCallbackTime,
      leadSource,
      message,
      landingPage,
      sourcePage,
      consent,
      consentAt,
      consentVersion: CONSENT_VERSION,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      gclid,
      gbraid,
      wbraid,
      msclkid,
      fbclid,
    });
  } catch (error) {
    console.error("Durable lead storage failed:", error);
    const configurationProblem = error instanceof EnquiryStorageConfigurationError;
    const storageProblem = error instanceof EnquiryStorageUnavailableError;

    return NextResponse.json(
      {
        ok: false,
        error:
          configurationProblem || storageProblem
            ? `We could not securely save your request right now. Please try again or call ${clinicContact.primaryCallDisplay}.`
            : `Your request could not be saved. Please try again or call ${clinicContact.primaryCallDisplay}.`,
      },
      { status: 503 },
    );
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email || "N/A");
  const safePhone = escapeHtml(phone);
  const safeCity = escapeHtml(city);
  const safeServiceNeeded = escapeHtml(serviceNeeded);
  const safePreferredChannel = escapeHtml(preferredChannel || "N/A");
  const safeMessage = escapeHtml(message || "No additional details supplied.").replace(
    /\n/g,
    "<br/>",
  );
  const safeLandingPage = escapeHtml(landingPage);
  const safeSourcePage = escapeHtml(sourcePage);

  let mail: ReturnType<typeof mailConfig>;

  try {
    mail = mailConfig();
    await sendMail({
      from: mail.from,
      to: mail.to,
      replyTo: email || undefined,
      subject: `New Enquiry - ${name} (Audiosen Website)`,
      text: [
        "New enquiry received from the Audiosen website.",
        `Lead ID: ${savedEnquiry.rowKey}`,
        `Submitted at: ${submittedAt}`,
        `Name: ${name}`,
        `Phone / WhatsApp: ${phone}`,
        `Email: ${email || "N/A"}`,
        `City: ${city}`,
        `Need: ${serviceNeeded}`,
        `Preferred channel: ${preferredChannel || "N/A"}`,
        `Landing page: ${landingPage}`,
        `Source page: ${sourcePage}`,
        `Campaign: ${utmCampaign || "N/A"}`,
        `Consent recorded: ${consentAt} (${CONSENT_VERSION})`,
        "",
        "Additional details:",
        message || "None supplied.",
      ].join("\n"),
      html: `
        <h2>New Enquiry Received (Audiosen Website)</h2>
        <p><strong>Lead ID:</strong> ${escapeHtml(savedEnquiry.rowKey)}</p>
        <p><strong>Submitted at:</strong> ${submittedAt}</p>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Phone / WhatsApp:</strong> ${safePhone}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>City:</strong> ${safeCity}</p>
        <p><strong>Need:</strong> ${safeServiceNeeded}</p>
        <p><strong>Preferred channel:</strong> ${safePreferredChannel}</p>
        <p><strong>Landing page:</strong> ${safeLandingPage}</p>
        <p><strong>Source page:</strong> ${safeSourcePage}</p>
        <p><strong>Consent recorded:</strong> ${consentAt} (${CONSENT_VERSION})</p>
        <p><strong>Additional details:</strong></p>
        <p>${safeMessage}</p>
      `,
    });
    await recordDeliverySafely(savedEnquiry, {
      staffNotificationStatus: "sent",
      staffNotificationAt: new Date().toISOString(),
      staffNotificationError: "",
    });
  } catch (error) {
    console.error("Staff enquiry notification failed:", error);
    await recordDeliverySafely(savedEnquiry, {
      staffNotificationStatus: "failed",
      staffNotificationError: deliveryErrorCode(error),
    });

    return NextResponse.json({
      ok: true,
      warning: `${getMailErrorMessage(error)} Your request was saved securely and the team can still follow it up.`,
    });
  }

  if (!email) {
    return NextResponse.json({
      ok: true,
      message: "Your request was saved. Please keep your phone or WhatsApp available for our reply.",
    });
  }

  try {
    await sendMail({
      from: mail.from,
      to: email,
      subject: "Your Audiosen hearing-care enquiry is confirmed",
      text: [
        `Dear ${name},`,
        "",
        "Your request has been securely received by Audiosen.",
        "Our team will contact you within 24 hours to discuss the most appropriate next step.",
        "",
        `Need help? Call ${clinicContact.primaryCallDisplay} or WhatsApp ${clinicContact.whatsappDisplay}.`,
        "",
        "Warm regards,",
        "Audiosen Hearing Care Solutions Team",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #0a5c9e, #00a1ab); color: #ffffff; padding: 20px 24px;">
            <h2 style="margin: 0; font-size: 22px;">Thank you, ${safeName}!</h2>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.95;">Your Audiosen request is confirmed.</p>
          </div>
          <div style="padding: 20px 24px; line-height: 1.6;">
            <p>Your request has been securely received. Our team will contact you within 24 hours to discuss the most appropriate next step.</p>
            <p>Need help? Call <strong>${clinicContact.primaryCallDisplay}</strong> or WhatsApp <strong>${clinicContact.whatsappDisplay}</strong>.</p>
            <p>Warm regards,<br/><strong>Audiosen Hearing Care Solutions Team</strong></p>
          </div>
        </div>
      `,
    });
    await recordDeliverySafely(savedEnquiry, {
      confirmationStatus: "sent",
      confirmationAt: new Date().toISOString(),
      confirmationError: "",
    });
  } catch (error) {
    console.error("Enquiry confirmation email failed:", error);
    await recordDeliverySafely(savedEnquiry, {
      confirmationStatus: "failed",
      confirmationError: deliveryErrorCode(error),
    });

    return NextResponse.json({
      ok: true,
      warning:
        "Your request was saved and our team was notified, but we could not send your confirmation email.",
    });
  }

  return NextResponse.json({ ok: true });
}
