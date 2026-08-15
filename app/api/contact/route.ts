import { NextRequest, NextResponse } from "next/server";
import { clinicContact } from "@/lib/content";
import { saveEnquiry } from "@/lib/enquiry-store";
import { mailConfig, sendMail } from "@/lib/mailer";
import { getClientKey, isRateLimited } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validation";

export const runtime = "nodejs";

function extractIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return getClientKey(forwarded || realIp || "unknown");
}

function getMailErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("16-character App Password")) {
      return "The email notification service is temporarily unavailable.";
    }
  }

  const candidate = error as
    | { code?: string; responseCode?: number }
    | undefined;

  if (candidate?.code === "EAUTH" || candidate?.responseCode === 535) {
    return "The email notification service could not authenticate.";
  }

  return `We could not process your request right now. Please call ${clinicContact.primaryCallDisplay}.`;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
  let enquirySaved = false;

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
    email,
    phone,
    city,
    language,
    serviceNeeded,
    preferredChannel,
    preferredCallbackTime,
    leadSource,
    message,
    website,
  } = parsed.data;

  // Honeypot: treat as successful to avoid leaking bot checks.
  if (website && website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  try {
    const mail = mailConfig();
    const submittedAt = new Date().toISOString();
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email || "N/A");
    const safePhone = escapeHtml(phone);
    const safeCity = escapeHtml(city || "N/A");
    const safeLanguage = escapeHtml(language || "N/A");
    const safeServiceNeeded = escapeHtml(serviceNeeded || "N/A");
    const safePreferredChannel = escapeHtml(preferredChannel || "N/A");
    const safePreferredCallbackTime = escapeHtml(preferredCallbackTime || "N/A");
    const safeLeadSource = escapeHtml(leadSource || "N/A");
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");

    await saveEnquiry({
      submittedAt,
      ipKey,
      name,
      email: email || "N/A",
      phone,
      city: city || "N/A",
      language: language || "N/A",
      serviceNeeded: serviceNeeded || "N/A",
      preferredChannel: preferredChannel || "N/A",
      preferredCallbackTime: preferredCallbackTime || "N/A",
      leadSource: leadSource || "N/A",
      message,
    });
    enquirySaved = true;

    await sendMail({
      from: mail.from,
      to: mail.to,
      replyTo: email || undefined,
      subject: `New Enquiry - ${name} (Audiosen Website)`,
      text: [
        "New enquiry received from audiosen website.",
        `Submitted at: ${submittedAt}`,
        `Source IP: ${ipKey}`,
        `Name: ${name}`,
        `Email: ${email || "N/A"}`,
        `Phone: ${phone}`,
        `City: ${city || "N/A"}`,
        `Language: ${language || "N/A"}`,
        `Service Needed: ${serviceNeeded || "N/A"}`,
        `Preferred Channel: ${preferredChannel || "N/A"}`,
        `Preferred Callback Time: ${preferredCallbackTime || "N/A"}`,
        `Lead Source: ${leadSource || "N/A"}`,
        "",
        "Message:",
        message,
      ].join("\n"),
      html: `
        <h2>New Enquiry Received (Audiosen Website)</h2>
        <p><strong>Submitted at:</strong> ${submittedAt}</p>
        <p><strong>Source IP:</strong> ${ipKey}</p>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Phone:</strong> ${safePhone}</p>
        <p><strong>City:</strong> ${safeCity}</p>
        <p><strong>Language:</strong> ${safeLanguage}</p>
        <p><strong>Service Needed:</strong> ${safeServiceNeeded}</p>
        <p><strong>Preferred Channel:</strong> ${safePreferredChannel}</p>
        <p><strong>Preferred Callback Time:</strong> ${safePreferredCallbackTime}</p>
        <p><strong>Lead Source:</strong> ${safeLeadSource}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
      `,
    });

    try {
      if (!email) {
        return NextResponse.json({
          ok: true,
          message:
            "Your enquiry has been saved successfully. Please keep your phone reachable for callback.",
        });
      }

      await sendMail({
        from: mail.from,
        to: email,
        subject: "Your Audiosen hearing-care enquiry is confirmed",
        text: [
          `Dear ${name},`,
          "",
          "Your hearing-care enquiry has been successfully received by Audiosen.",
          "",
          "What happens next:",
          "1) Our audiology team will review your request.",
          "2) We will call you within 24 hours to schedule your appointment.",
          "3) We will explain the appropriate consultation, assessment, or service next step.",
          "",
          "Your submitted details:",
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone}`,
          `City: ${city || "N/A"}`,
          `Preferred Callback: ${preferredCallbackTime || "N/A"}`,
          `Preferred Channel: ${preferredChannel || "N/A"}`,
          `Message: ${message}`,
          "",
          `Need help? Call us at ${clinicContact.primaryCallDisplay} (WhatsApp ${clinicContact.whatsappDisplay}).`,
          "",
          "Warm regards,",
          "Audiosen Hearing Care Solutions Team",
        ].join("\n"),
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #0a5c9e, #00a1ab); color: #ffffff; padding: 20px 24px;">
              <h2 style="margin: 0; font-size: 22px;">Thank you, ${safeName}!</h2>
              <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.95;">Your Audiosen enquiry is confirmed.</p>
            </div>
            <div style="padding: 20px 24px; line-height: 1.6;">
              <p style="margin-top: 0;">
                Your hearing-care enquiry has been successfully received by Audiosen.
              </p>
              <p><strong>What happens next:</strong></p>
              <ol style="padding-left: 18px; margin-top: 6px;">
                <li>Our audiology team will review your details.</li>
                <li>We will call you within 24 hours to schedule your appointment.</li>
                <li>We will explain the appropriate consultation, assessment, or service next step.</li>
              </ol>
              <div style="margin-top: 14px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
                <p style="margin: 0 0 8px;"><strong>Your submitted details:</strong></p>
                <p style="margin: 0;">Name: ${safeName}<br/>Email: ${safeEmail}<br/>Phone: ${safePhone}</p>
                <p style="margin: 8px 0 0;">City: ${safeCity}<br/>Preferred callback: ${safePreferredCallbackTime}<br/>Preferred channel: ${safePreferredChannel}</p>
                <p style="margin: 8px 0 0;">Message:<br/>${safeMessage}</p>
              </div>
              <p style="margin-top: 16px;">
                Need help immediately? Call us at <strong>${clinicContact.primaryCallDisplay}</strong> or WhatsApp <strong>${clinicContact.whatsappDisplay}</strong>.
              </p>
              <p style="margin-bottom: 0;">
                Warm regards,<br/>
                <strong>Audiosen Hearing Care Solutions Team</strong>
              </p>
            </div>
          </div>
        `,
      });
    } catch (confirmationError) {
      console.error("Patient confirmation email failed:", confirmationError);
      return NextResponse.json({
        ok: true,
        warning:
          "Your enquiry was saved and the clinic email was sent, but the patient confirmation email could not be sent right now.",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact API error:", error);
    const message = getMailErrorMessage(error);

    if (enquirySaved) {
      return NextResponse.json({
        ok: true,
        warning: `${message} Your enquiry was saved securely and the team can still follow it up.`,
      });
    }

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
