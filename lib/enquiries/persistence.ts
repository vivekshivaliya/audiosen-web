import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  AttachmentPurpose,
  EmailOutboxKind,
  EnquiryType,
  Prisma,
  UploadSessionStatus,
  type PrismaClient,
} from "@prisma/client";
import { DatabaseNotConfiguredError, getPrisma, isDatabaseConfigured } from "@/lib/db";
import { ENQUIRY_CONSENT_VERSION } from "@/lib/enquiries/constants";
import { buildOutboxEmails } from "@/lib/enquiries/email";
import { encryptEnquiryPayload } from "@/lib/enquiries/encryption";
import { normalizeEnquiry } from "@/lib/enquiries/normalize";
import type { EnquiryInput } from "@/lib/enquiries/schema";
import {
  generatedPublicReference,
  privacySafeIpHash,
  requestFingerprint,
  sha256,
} from "@/lib/enquiries/security";

const typeMap: Record<EnquiryInput["type"], EnquiryType> = {
  contact: EnquiryType.CONTACT,
  appointment: EnquiryType.CONSULTATION,
  consultation: EnquiryType.CONSULTATION,
  product_enquiry: EnquiryType.PRODUCT_ENQUIRY,
  request_price: EnquiryType.REQUEST_PRICE,
  offer: EnquiryType.OFFER,
  home_visit: EnquiryType.HOME_VISIT,
  repair: EnquiryType.REPAIR,
  speech: EnquiryType.SPEECH,
  finder: EnquiryType.HEARING_AID_FINDER,
  hearing_aid_finder: EnquiryType.HEARING_AID_FINDER,
  trial: EnquiryType.TRIAL,
  callback: EnquiryType.CALLBACK,
  audiogram: EnquiryType.AUDIOGRAM,
  whatsapp_lead: EnquiryType.WHATSAPP_LEAD,
};

const developmentIdempotency = new Map<
  string,
  { reference: string; fingerprint: string; selectedDevice?: string; service: string }
>();

export class IdempotencyConflictError extends Error {
  constructor() {
    super("This idempotency key was already used for a different request.");
    this.name = "IdempotencyConflictError";
  }
}

export class EnquiryPersistenceError extends Error {
  readonly causeCode?: string;

  constructor(message: string, causeCode?: string) {
    super(message);
    this.name = "EnquiryPersistenceError";
    this.causeCode = causeCode;
  }
}

export class InvalidUploadClaimError extends Error {
  constructor(message = "An attachment claim is invalid or expired.") {
    super(message);
    this.name = "InvalidUploadClaimError";
  }
}

export type SaveEnquiryOptions = {
  idempotencyKey: string;
  fallbackSourcePath: string;
  clientIp: string;
  userAgent?: string;
};

export type SaveEnquiryResult = {
  reference: string;
  service: string;
  selectedDevice?: string;
  deduplicated: boolean;
  backend: "postgresql" | "development-file";
};

function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function jsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function clickIds(input: EnquiryInput): Prisma.InputJsonValue | undefined {
  const values = {
    gclid: optional(input.attribution?.gclid),
    gbraid: optional(input.attribution?.gbraid),
    wbraid: optional(input.attribution?.wbraid),
    msclkid: optional(input.attribution?.msclkid),
    fbclid: optional(input.attribution?.fbclid),
  };
  return Object.values(values).some(Boolean) ? jsonValue(values) : undefined;
}

function appointmentDate(value: string | undefined): Date | undefined {
  return value ? new Date(`${value}T00:00:00.000Z`) : undefined;
}

function safeContext(input: EnquiryInput): Prisma.InputJsonValue | undefined {
  const routingContext = {
    sourcePath: input.context?.sourcePath,
    journey: input.context?.journey,
    brandSlug: input.context?.brandSlug,
    modelSlug: input.context?.modelSlug,
    compareSlugs: input.context?.compareSlugs,
    guardianConsent: input.guardianConsent,
  };
  return Object.values(routingContext).some((value) => value !== undefined && value !== "")
    ? jsonValue(routingContext)
    : undefined;
}

function sensitiveEnvelope(input: EnquiryInput, hearingConcern: string | undefined) {
  const details = input.details
    ? {
        ...input.details,
        attachmentIds: input.details.attachments?.map(({ attachmentId }) => attachmentId),
        attachments: undefined,
      }
    : undefined;
  const payload = {
    message: optional(input.message),
    hearingConcern,
    details,
    finderPreferences: input.context?.preferences,
  };
  const hasSensitiveData = Object.values(payload).some((value) => value !== undefined);
  return hasSensitiveData ? encryptEnquiryPayload(payload) : undefined;
}

async function claimUploads(
  transaction: Prisma.TransactionClient,
  enquiryId: string,
  input: EnquiryInput,
): Promise<void> {
  const claims = input.details?.attachments || [];
  if (claims.length === 0) return;
  const expectedPurpose =
    input.type === "repair"
      ? AttachmentPurpose.DEVICE_PHOTO
      : input.type === "audiogram"
        ? AttachmentPurpose.AUDIOGRAM
        : undefined;
  if (!expectedPurpose) throw new InvalidUploadClaimError();

  for (const claim of claims) {
    const claimTokenHash = sha256(claim.claimToken);
    const session = await transaction.uploadSession.findUnique({
      where: { claimTokenHash },
      include: { attachments: { select: { id: true, purpose: true } } },
    });
    const attachment = session?.attachments.find((item) => item.id === claim.attachmentId);
    if (
      !session ||
      !attachment ||
      attachment.purpose !== expectedPurpose ||
      session.status !== UploadSessionStatus.READY ||
      session.expiresAt <= new Date()
    ) {
      throw new InvalidUploadClaimError();
    }

    const claimed = await transaction.uploadSession.updateMany({
      where: {
        id: session.id,
        status: UploadSessionStatus.READY,
        expiresAt: { gt: new Date() },
      },
      data: {
        status: UploadSessionStatus.CLAIMED,
        enquiryId,
        claimedAt: new Date(),
      },
    });
    if (claimed.count !== 1) throw new InvalidUploadClaimError();
    await transaction.enquiryAttachment.update({
      where: { id: attachment.id },
      data: { enquiryId },
    });
  }
}

async function existingResult(
  prisma: PrismaClient,
  idempotencyHash: string,
  fingerprint: string,
): Promise<SaveEnquiryResult | null> {
  const existing = await prisma.enquiry.findUnique({
    where: { idempotencyHash },
    select: { reference: true, service: true, selectedDevice: true, requestFingerprint: true },
  });
  if (!existing) return null;
  if (existing.requestFingerprint !== fingerprint) throw new IdempotencyConflictError();

  return {
    reference: existing.reference,
    service: existing.service,
    selectedDevice: existing.selectedDevice || undefined,
    deduplicated: true,
    backend: "postgresql",
  };
}

async function saveToPostgres(
  input: EnquiryInput,
  options: SaveEnquiryOptions,
): Promise<SaveEnquiryResult> {
  const prisma = getPrisma();
  const normalized = normalizeEnquiry(input, options.fallbackSourcePath);
  const idempotencyHash = sha256(options.idempotencyKey);
  const fingerprint = requestFingerprint(input);
  const alreadySaved = await existingResult(prisma, idempotencyHash, fingerprint);
  if (alreadySaved) return alreadySaved;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const reference = generatedPublicReference();
    const submittedAt = new Date();
    const emails = buildOutboxEmails(reference, input, normalized, submittedAt);
    const encryptedSensitiveData = sensitiveEnvelope(input, normalized.hearingConcern);

    try {
      const createdInThisRequest = await prisma.$transaction(async (transaction) => {
        const duplicate = await transaction.enquiry.findUnique({
          where: { idempotencyHash },
          select: { requestFingerprint: true },
        });
        if (duplicate) {
          if (duplicate.requestFingerprint !== fingerprint) throw new IdempotencyConflictError();
          return false;
        }

        const created = await transaction.enquiry.create({
          data: {
            reference,
            idempotencyHash,
            requestFingerprint: fingerprint,
            type: typeMap[input.type],
            name: input.name,
            email: optional(input.email),
            phone: input.phone,
            city: input.city || "",
            age: normalized.age,
            ageGroup: normalized.ageGroup,
            service: input.service,
            selectedBrand: normalized.selectedBrand,
            selectedDevice: normalized.selectedDevice,
            appointmentDate: appointmentDate(normalized.appointmentDate),
            appointmentTime: normalized.appointmentTime,
            preferredChannel: normalized.preferredChannel,
            preferredCallbackTime: normalized.preferredCallbackTime,
            homeVisit: normalized.homeVisit,
            source: normalized.source,
            sourcePath: normalized.sourcePath,
            landingPage: input.attribution?.landingPage || input.landingPage || undefined,
            utmSource: optional(input.attribution?.utmSource),
            utmMedium: optional(input.attribution?.utmMedium),
            utmCampaign: optional(input.attribution?.utmCampaign),
            utmTerm: optional(input.attribution?.utmTerm),
            utmContent: optional(input.attribution?.utmContent),
            clickIds: clickIds(input),
            context: safeContext(input),
            consent: input.consent,
            consentAt: submittedAt,
            consentVersion: ENQUIRY_CONSENT_VERSION,
            clientIpHash: privacySafeIpHash(options.clientIp),
            userAgent: optional(options.userAgent?.slice(0, 500)),
            createdAt: submittedAt,
            sensitiveData: encryptedSensitiveData
              ? {
                  create: encryptedSensitiveData,
                }
              : undefined,
            outbox: {
              create: emails.map((email) => ({
                kind: EmailOutboxKind[email.kind],
                dedupeKey: email.dedupeKey,
                fromAddress: email.fromAddress,
                toAddress: email.toAddress,
                replyToAddress: email.replyToAddress,
                subject: email.subject,
                textBody: email.textBody,
                htmlBody: email.htmlBody,
              })),
            },
          },
        });
        await claimUploads(transaction, created.id, input);
        return true;
      });

      const result = await existingResult(prisma, idempotencyHash, fingerprint);
      if (!result) throw new EnquiryPersistenceError("The saved enquiry could not be read.");
      return { ...result, deduplicated: !createdInThisRequest };
    } catch (error) {
      if (error instanceof IdempotencyConflictError || error instanceof InvalidUploadClaimError) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const duplicate = await existingResult(prisma, idempotencyHash, fingerprint);
        if (duplicate) return duplicate;
        if (attempt === 0) continue;
      }
      const code = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined;
      throw new EnquiryPersistenceError("PostgreSQL enquiry persistence failed.", code);
    }
  }

  throw new EnquiryPersistenceError("Could not allocate a unique enquiry reference.");
}

function mayUseDevelopmentFallback(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_NDJSON_ENQUIRY_FALLBACK === "true"
  );
}

async function saveToDevelopmentFile(
  input: EnquiryInput,
  options: SaveEnquiryOptions,
): Promise<SaveEnquiryResult> {
  if (!mayUseDevelopmentFallback()) throw new DatabaseNotConfiguredError();
  if (input.details?.attachments?.length) {
    throw new InvalidUploadClaimError("Secure attachments require PostgreSQL persistence.");
  }
  const normalized = normalizeEnquiry(input, options.fallbackSourcePath);
  const idempotencyHash = sha256(options.idempotencyKey);
  const fingerprint = requestFingerprint(input);
  const existing = developmentIdempotency.get(idempotencyHash);
  if (existing) {
    if (existing.fingerprint !== fingerprint) throw new IdempotencyConflictError();
    return { ...existing, deduplicated: true, backend: "development-file" };
  }

  const reference = generatedPublicReference();
  const submittedAt = new Date();
  const emails = buildOutboxEmails(reference, input, normalized, submittedAt);
  const encryptedSensitiveData = sensitiveEnvelope(input, normalized.hearingConcern);
  const dataDirectory = process.env.AUDIOSEN_DATA_DIR || path.join(process.cwd(), "data");
  const logPath = path.join(dataDirectory, "enquiries-v2.ndjson");
  const event = {
    eventType: "enquiry.created-with-outbox",
    schemaVersion: 2,
    reference,
    idempotencyHash,
    requestFingerprint: fingerprint,
    input: {
      ...input,
      message: undefined,
      details: undefined,
      context: input.context
        ? { ...input.context, preferences: undefined }
        : undefined,
      turnstileToken: undefined,
    },
    normalized: {
      ...normalized,
      hearingConcern: undefined,
    },
    sensitiveData: encryptedSensitiveData,
    consentVersion: ENQUIRY_CONSENT_VERSION,
    consentAt: submittedAt.toISOString(),
    clientIpHash: privacySafeIpHash(options.clientIp),
    outbox: emails,
    createdAt: submittedAt.toISOString(),
  };

  await mkdir(dataDirectory, { recursive: true });
  await appendFile(logPath, `${JSON.stringify(event)}\n`, { encoding: "utf8", mode: 0o600 });
  const stored = {
    reference,
    fingerprint,
    selectedDevice: normalized.selectedDevice,
    service: input.service,
  };
  developmentIdempotency.set(idempotencyHash, stored);
  return { ...stored, deduplicated: false, backend: "development-file" };
}

export async function saveEnquiryWithOutbox(
  input: EnquiryInput,
  options: SaveEnquiryOptions,
): Promise<SaveEnquiryResult> {
  if (isDatabaseConfigured()) return saveToPostgres(input, options);
  try {
    return await saveToDevelopmentFile(input, options);
  } catch (error) {
    if (error instanceof IdempotencyConflictError || error instanceof InvalidUploadClaimError) {
      throw error;
    }
    if (error instanceof DatabaseNotConfiguredError) {
      throw new EnquiryPersistenceError("Production enquiry database is not configured.");
    }
    throw new EnquiryPersistenceError("Development enquiry persistence failed.");
  }
}
