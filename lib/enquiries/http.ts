import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { contactSchema, type ContactInput } from "@/lib/validation";
import { consumeRateLimit, getNamespacedClientKey } from "@/lib/rate-limit";
import {
  BodyTooLargeError,
  clientAddress,
  generatedIdempotencyKey,
  generatedPublicReference,
  isAllowedEnquiryOrigin,
  readJsonBody,
  requestFingerprint,
  sha256,
} from "@/lib/enquiries/security";
import { enquirySchema, idempotencyKeySchema, type EnquiryInput } from "@/lib/enquiries/schema";
import { buildOutboxEmails } from "@/lib/enquiries/email";
import { normalizeEnquiry, normalizePhoneNumber } from "@/lib/enquiries/normalize";
import { sendOptionalPatientConfirmations } from "@/lib/enquiries/notifications";
import { sendQueuedEmail } from "@/lib/mailer";
import {
  EnquiryPersistenceError,
  IdempotencyConflictError,
  InvalidUploadClaimError,
  saveEnquiryWithOutbox,
} from "@/lib/enquiries/persistence";
import {
  createThankYouContextToken,
  THANK_YOU_COOKIE,
  THANK_YOU_COOKIE_MAX_AGE,
} from "@/lib/enquiries/thank-you-context";
import { verifyTurnstile } from "@/lib/enquiries/turnstile";
import {
  verifyUploadVerificationGrant,
  type UploadGrantVerification,
  type UploadVerificationPurpose,
} from "@/lib/uploads/verification-grant";

type HandlerMode = "canonical" | "contact-compatibility";
const SAFE_RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Vary: "Origin",
};

const mailOnlyReceipts = new Map<string, { fingerprint: string; reference: string; expiresAt: number }>();

async function sendMailOnlyEnquiry(
  input: EnquiryInput,
  idempotencyKey: string,
  fallbackSourcePath: string,
): Promise<{ reference: string; deduplicated: boolean }> {
  if (input.details?.attachments?.length) {
    throw new Error("Mail-only enquiries do not accept attachments.");
  }

  const now = Date.now();
  const idempotencyHash = sha256(idempotencyKey);
  const fingerprint = requestFingerprint(input);
  const existing = mailOnlyReceipts.get(idempotencyHash);
  if (existing && existing.expiresAt > now) {
    if (existing.fingerprint !== fingerprint) throw new IdempotencyConflictError();
    return { reference: existing.reference, deduplicated: true };
  }

  const reference = generatedPublicReference();
  const normalized = normalizeEnquiry(input, fallbackSourcePath);
  const messages = buildOutboxEmails(reference, input, normalized, new Date());
  await Promise.all(
    messages.map((message) =>
      sendQueuedEmail({
        to: message.toAddress,
        replyTo: message.replyToAddress,
        subject: message.subject,
        text: message.textBody,
        html: message.htmlBody,
        operationId: randomUUID(),
      }),
    ),
  );
  await sendOptionalPatientConfirmations(input.phone);
  mailOnlyReceipts.set(idempotencyHash, {
    fingerprint,
    reference,
    expiresAt: now + 10 * 60_000,
  });
  return { reference, deduplicated: false };
}

function json(payload: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return NextResponse.json(payload, {
    status,
    headers: { ...SAFE_RESPONSE_HEADERS, ...extraHeaders },
  });
}

function pagePath(value: string | undefined, fallback = "/"): string {
  if (!value) return fallback;
  try {
    const pathname = new URL(value, "https://audiosen.com").pathname.slice(0, 500);
    return pathname.startsWith("/") && !pathname.startsWith("//") ? pathname || fallback : fallback;
  } catch {
    return fallback;
  }
}

function legacyInput(input: ContactInput, request: NextRequest): EnquiryInput {
  const refererPath = pagePath(request.headers.get("referer") || undefined);
  const sourcePath = pagePath(input.sourcePage, refererPath);
  const landingPage = pagePath(input.landingPage, sourcePath);
  return {
    type: "contact",
    name: input.name,
    email: input.email,
    phone: input.phone,
    city: input.city,
    service: input.serviceNeeded,
    message: input.message,
    preferredChannel: input.preferredChannel,
    preferredCallbackTime: input.preferredCallbackTime,
    source: input.leadSource || "website_contact_form",
    sourcePath,
    landingPage,
    context: { sourcePath, journey: "legacy-contact-form" },
    attribution: {
      landingPage,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      utmTerm: input.utmTerm,
      utmContent: input.utmContent,
      gclid: input.gclid,
      gbraid: input.gbraid,
      wbraid: input.wbraid,
      msclkid: input.msclkid,
      fbclid: input.fbclid,
    },
    consent: input.consent,
    turnstileToken: input.turnstileToken,
    website: input.website,
  };
}

function payloadRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function canonicalCompatibilityInput(value: unknown): unknown {
  const record = payloadRecord(value);
  if (!record) return value;
  const existingDetails = payloadRecord(record.details) || {};
  const directDetailKeys = [
    "age", "selectedBrand", "selectedDevice", "hearingConcern", "appointmentDate",
    "appointmentTime", "homeVisit", "repairBrand", "deviceModel", "problem", "deviceAge",
    "warrantyStatus", "attachmentIds", "attachments", "existingAudiogram",
    "currentHearingAid", "preferredBrand", "preferredDevice", "offerId", "finderAnswers",
  ];
  const details = { ...existingDetails };
  for (const key of directDetailKeys) {
    if (details[key] === undefined && record[key] !== undefined) details[key] = record[key];
  }
  return {
    ...record,
    service: record.service ?? record.serviceNeeded,
    source: record.source ?? record.leadSource,
    sourcePath: record.sourcePath ?? record.sourcePage,
    details,
  };
}

function idempotencyKeyFrom(
  request: NextRequest,
  payload: unknown,
  parsedInput: EnquiryInput,
  clientKey: string,
  mode: HandlerMode,
): { key?: string; error?: string } {
  const record = payloadRecord(payload);
  const candidate = request.headers.get("idempotency-key") ||
    (typeof record?.idempotencyKey === "string" ? record.idempotencyKey : undefined);
  if (candidate) {
    const parsed = idempotencyKeySchema.safeParse(candidate);
    return parsed.success
      ? { key: parsed.data }
      : { error: "Idempotency-Key must be 8-200 letters, numbers, dots, colons, underscores, or hyphens." };
  }
  if (mode === "contact-compatibility") return { key: `legacy:${randomUUID()}` };
  return { key: generatedIdempotencyKey(requestFingerprint(parsedInput), clientKey) };
}

function logOperationalFailure(error: unknown): void {
  const value = error as { name?: string; causeCode?: string } | undefined;
  console.error("Enquiry persistence unavailable", {
    errorType: value?.name || "UnknownError",
    code: value?.causeCode || "unknown",
  });
}

function attachmentGrantFailure(result: Exclude<UploadGrantVerification, { ok: true }>) {
  if (result.code === "NOT_CONFIGURED") {
    return json({
      ok: false,
      code: "BOT_PROTECTION_NOT_CONFIGURED",
      error: "Online enquiries are temporarily unavailable.",
    }, 503);
  }
  return json({
    ok: false,
    code: "BOT_VERIFICATION_FAILED",
    error: result.code === "CLIENT_MISMATCH"
      ? "Your secure upload session changed. Please select the file again and retry."
      : "Your secure upload expired or is invalid. Please select the file again and retry.",
  }, 400);
}

function expectedUploadPurpose(input: EnquiryInput): UploadVerificationPurpose | undefined {
  if (input.type === "repair") return "device_photo";
  if (input.type === "audiogram") return "audiogram";
  return undefined;
}

function verifyAttachmentGrants(
  input: EnquiryInput,
  ip: string,
  userAgent: string,
): UploadGrantVerification | null {
  const attachments = input.details?.attachments || [];
  if (attachments.length === 0) return null;
  const purpose = expectedUploadPurpose(input);
  if (!purpose) return { ok: false, code: "INVALID" };

  for (const attachment of attachments) {
    if (!attachment.verificationGrant) return { ok: false, code: "INVALID" };
    const result = verifyUploadVerificationGrant({
      grant: attachment.verificationGrant,
      attachmentId: attachment.attachmentId,
      claimToken: attachment.claimToken,
      purpose,
      ip,
      userAgent,
    });
    if (!result.ok) return result;
  }
  return { ok: true };
}

function withoutBotCredentials(input: EnquiryInput): EnquiryInput {
  return {
    ...input,
    turnstileToken: undefined,
    details: input.details
      ? {
          ...input.details,
          attachments: input.details.attachments?.map(({ attachmentId, claimToken }) => ({
            attachmentId,
            claimToken,
          })),
        }
      : undefined,
  };
}

export async function handleEnquiryPost(
  request: NextRequest,
  mode: HandlerMode = "canonical",
): Promise<NextResponse> {
  if (process.env.PUBLIC_ENQUIRIES_ENABLED === "false") {
    return json({ ok: false, code: "ENQUIRIES_DISABLED", error: "Online enquiries are temporarily unavailable." }, 503);
  }
  if (!isAllowedEnquiryOrigin(request)) {
    return json({ ok: false, error: "This submission origin is not allowed." }, 403);
  }
  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.startsWith("application/json")) {
    return json({ ok: false, error: "Content-Type must be application/json." }, 415);
  }

  const ip = clientAddress(request);
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) || "unknown";
  const clientKey = sha256(`${ip}:${userAgent}`).slice(0, 32);
  const rateLimit = consumeRateLimit(getNamespacedClientKey("enquiry", clientKey), {
    maxRequests: 8,
    windowMs: 10 * 60_000,
  });
  if (rateLimit.limited) {
    return json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  let payload: unknown;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    return error instanceof BodyTooLargeError
      ? json({ ok: false, error: "Request body is too large." }, 413)
      : json({ ok: false, error: "Invalid JSON payload." }, 400);
  }

  let input: EnquiryInput;
  if (mode === "contact-compatibility") {
    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) {
      return json({ ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors }, 400);
    }
    input = legacyInput(parsed.data, request);
  } else {
    const parsed = enquirySchema.safeParse(canonicalCompatibilityInput(payload));
    if (!parsed.success) {
      return json({
        ok: false,
        error: "Please correct the highlighted fields.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      }, 400);
    }
    input = parsed.data;
  }

  input = { ...input, phone: normalizePhoneNumber(input.phone) };

  if (input.website) {
    const reference = generatedPublicReference();
    return json({ ok: true, reference, referenceId: reference, redirectTo: "/thank-you", thankYouUrl: "/thank-you" });
  }

  const attachmentGrant = verifyAttachmentGrants(input, ip, userAgent);
  if (attachmentGrant && !attachmentGrant.ok) {
    return attachmentGrantFailure(attachmentGrant);
  }
  if (!attachmentGrant) {
    const turnstile = await verifyTurnstile(input.turnstileToken, ip);
    if (!turnstile.ok) {
      if (turnstile.code === "NOT_CONFIGURED") {
        return json({ ok: false, code: "BOT_PROTECTION_NOT_CONFIGURED", error: "Online enquiries are temporarily unavailable." }, 503);
      }
      if (turnstile.code === "UNAVAILABLE") {
        return json({ ok: false, code: "BOT_PROTECTION_UNAVAILABLE", error: "Bot verification is temporarily unavailable. Please try again." }, 503);
      }
      return json({ ok: false, code: "BOT_VERIFICATION_FAILED", error: "Please complete bot verification and try again." }, 400);
    }
  }

  // Neither the Turnstile response nor the signed upload grant reaches persistence or logs.
  const persistenceInput = withoutBotCredentials(input);
  const idempotency = idempotencyKeyFrom(request, payload, persistenceInput, clientKey, mode);
  if (!idempotency.key) return json({ ok: false, error: idempotency.error }, 400);
  const fallbackSourcePath = pagePath(
    input.context?.sourcePath || input.sourcePath || request.headers.get("referer") || undefined,
  );

  try {
    if (process.env.ENQUIRY_DELIVERY_MODE === "mail-only") {
      const delivered = await sendMailOnlyEnquiry(
        persistenceInput,
        idempotency.key,
        fallbackSourcePath,
      );
      const token = createThankYouContextToken({
        reference: delivered.reference,
        service: persistenceInput.service,
        selectedDevice: persistenceInput.details?.selectedDevice || persistenceInput.device,
      });
      const response = json({
        ok: true,
        reference: delivered.reference,
        referenceId: delivered.reference,
        redirectTo: "/thank-you",
        thankYouUrl: "/thank-you",
        deduplicated: delivered.deduplicated,
        message: "Your request was emailed to Audiosen and your confirmation was sent.",
      }, delivered.deduplicated ? 200 : 201);
      if (token) {
        response.cookies.set(THANK_YOU_COOKIE, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/thank-you",
          maxAge: THANK_YOU_COOKIE_MAX_AGE,
        });
      }
      return response;
    }
    const saved = await saveEnquiryWithOutbox(persistenceInput, {
      idempotencyKey: idempotency.key,
      fallbackSourcePath,
      clientIp: ip,
      userAgent,
    });
    const token = createThankYouContextToken({
      reference: saved.reference,
      service: saved.service,
      selectedDevice: saved.selectedDevice,
    });
    const response = json({
      ok: true,
      reference: saved.reference,
      referenceId: saved.reference,
      redirectTo: "/thank-you",
      thankYouUrl: "/thank-you",
      deduplicated: saved.deduplicated,
      message: "Your request was saved. Our team will contact you shortly.",
    }, saved.deduplicated ? 200 : 201);
    if (token) {
      response.cookies.set(THANK_YOU_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/thank-you",
        maxAge: THANK_YOU_COOKIE_MAX_AGE,
      });
    }
    return response;
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      return json({ ok: false, error: error.message }, 409);
    }
    if (error instanceof InvalidUploadClaimError) {
      return json({ ok: false, code: "INVALID_UPLOAD_CLAIM", error: error.message }, 409);
    }
    if (error instanceof EnquiryPersistenceError) logOperationalFailure(error);
    return json({
      ok: false,
      error: "We could not securely save your request right now. Please try again or call 8923092563.",
    }, 503);
  }
}
