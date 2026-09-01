import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";

export const UPLOAD_TURNSTILE_HEADER = "x-audiosen-turnstile-token";
export const UPLOAD_VERIFICATION_GRANT_TTL_SECONDS = 30 * 60;

export type UploadVerificationPurpose = "device_photo" | "audiogram";

type UploadGrantClient = {
  ip: string;
  userAgent: string;
};

type CreateUploadGrantInput = UploadGrantClient & {
  attachmentId: string;
  claimToken: string;
  purpose: UploadVerificationPurpose;
  expiresAt: Date;
};

type VerifyUploadGrantInput = UploadGrantClient & {
  grant: string;
  attachmentId: string;
  claimToken: string;
  purpose: UploadVerificationPurpose;
};

type GrantOptions = {
  now?: Date;
  secret?: string;
};

export type UploadGrantVerification =
  | { ok: true }
  | { ok: false; code: "NOT_CONFIGURED" | "INVALID" | "EXPIRED" | "CLIENT_MISMATCH" };

const payloadSchema = z
  .object({
    v: z.literal(1),
    aid: z.string().uuid(),
    ch: z.string().regex(/^[a-f0-9]{64}$/),
    purpose: z.enum(["device_photo", "audiogram"]),
    cb: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    iat: z.number().int().nonnegative(),
    exp: z.number().int().positive(),
  })
  .strict();

export class UploadGrantConfigurationError extends Error {
  constructor(message = "Upload verification grants are not configured.") {
    super(message);
    this.name = "UploadGrantConfigurationError";
  }
}

function configuredSecret(explicit?: string): string {
  const secret = (explicit ?? process.env.UPLOAD_VERIFICATION_GRANT_SECRET)?.trim();
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new UploadGrantConfigurationError();
  }
  return secret;
}

export function assertUploadVerificationGrantConfigured(secret?: string): void {
  configuredSecret(secret);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function signature(secret: string, encodedPayload: string): Buffer {
  return createHmac("sha256", secret)
    .update(`audiosen.upload-verification.v1.${encodedPayload}`)
    .digest();
}

function clientBinding(secret: string, client: UploadGrantClient): string {
  const ip = (client.ip || "unknown").trim().slice(0, 128) || "unknown";
  const userAgent = (client.userAgent || "unknown").trim().slice(0, 500) || "unknown";
  return createHmac("sha256", secret)
    .update(`audiosen.upload-client.v1\n${ip}\n${userAgent}`)
    .digest("base64url");
}

function safelyEqual(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createUploadVerificationGrant(
  input: CreateUploadGrantInput,
  options: GrantOptions = {},
): string {
  const secret = configuredSecret(options.secret);
  const now = Math.floor((options.now ?? new Date()).getTime() / 1000);
  const expiresAt = Math.floor(input.expiresAt.getTime() / 1000);
  if (
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= now ||
    expiresAt - now > UPLOAD_VERIFICATION_GRANT_TTL_SECONDS
  ) {
    throw new Error("Upload verification grant expiry is invalid.");
  }

  const payload = payloadSchema.parse({
    v: 1,
    aid: input.attachmentId,
    ch: sha256(input.claimToken),
    purpose: input.purpose,
    cb: clientBinding(secret, input),
    iat: now,
    exp: expiresAt,
  });
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${signature(secret, encodedPayload).toString("base64url")}`;
}

export function verifyUploadVerificationGrant(
  input: VerifyUploadGrantInput,
  options: GrantOptions = {},
): UploadGrantVerification {
  let secret: string;
  try {
    secret = configuredSecret(options.secret);
  } catch (error) {
    if (error instanceof UploadGrantConfigurationError) {
      return { ok: false, code: "NOT_CONFIGURED" };
    }
    return { ok: false, code: "INVALID" };
  }

  if (input.grant.length < 80 || input.grant.length > 2048) {
    return { ok: false, code: "INVALID" };
  }
  const segments = input.grant.split(".");
  if (
    segments.length !== 2 ||
    !segments[0] ||
    !segments[1] ||
    !/^[A-Za-z0-9_-]+$/.test(segments[0]) ||
    !/^[A-Za-z0-9_-]+$/.test(segments[1])
  ) {
    return { ok: false, code: "INVALID" };
  }

  try {
    const suppliedSignature = Buffer.from(segments[1], "base64url");
    const expectedSignature = signature(secret, segments[0]);
    if (!safelyEqual(suppliedSignature, expectedSignature)) {
      return { ok: false, code: "INVALID" };
    }

    const parsed = payloadSchema.safeParse(
      JSON.parse(Buffer.from(segments[0], "base64url").toString("utf8")),
    );
    if (!parsed.success) return { ok: false, code: "INVALID" };

    const now = Math.floor((options.now ?? new Date()).getTime() / 1000);
    if (
      parsed.data.exp <= now ||
      parsed.data.iat > now + 30 ||
      parsed.data.exp <= parsed.data.iat ||
      parsed.data.exp - parsed.data.iat > UPLOAD_VERIFICATION_GRANT_TTL_SECONDS
    ) {
      return { ok: false, code: "EXPIRED" };
    }
    if (
      parsed.data.aid !== input.attachmentId ||
      parsed.data.purpose !== input.purpose ||
      !safelyEqual(Buffer.from(parsed.data.ch), Buffer.from(sha256(input.claimToken)))
    ) {
      return { ok: false, code: "INVALID" };
    }
    const expectedClientBinding = clientBinding(secret, input);
    if (!safelyEqual(Buffer.from(parsed.data.cb), Buffer.from(expectedClientBinding))) {
      return { ok: false, code: "CLIENT_MISMATCH" };
    }
    return { ok: true };
  } catch {
    return { ok: false, code: "INVALID" };
  }
}
