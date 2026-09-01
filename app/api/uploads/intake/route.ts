import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit, getNamespacedClientKey } from "@/lib/rate-limit";
import { clientAddress, isAllowedEnquiryOrigin, sha256 } from "@/lib/enquiries/security";
import { verifyTurnstile, type TurnstileResult } from "@/lib/enquiries/turnstile";
import {
  intakeUpload,
  parseUploadPurpose,
  UploadNotConfiguredError,
  UploadValidationError,
} from "@/lib/uploads/intake";
import {
  assertUploadVerificationGrantConfigured,
  UPLOAD_TURNSTILE_HEADER,
  UploadGrantConfigurationError,
} from "@/lib/uploads/verification-grant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_REQUEST_BYTES = 11 * 1024 * 1024;
const headers = { "Cache-Control": "no-store, max-age=0", Vary: "Origin" };

type UploadIntakeDependencies = {
  assertGrantConfigured: () => void;
  verifyBot: typeof verifyTurnstile;
  readForm: (request: NextRequest) => Promise<FormData>;
  storeUpload: typeof intakeUpload;
};

function json(payload: unknown, status: number) {
  return NextResponse.json(payload, { status, headers });
}

function validateMultipartHeaders(request: NextRequest): void {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    throw new UploadValidationError("Content-Type must be multipart/form-data.", 415);
  }

  const declaredHeader = request.headers.get("content-length");
  if (declaredHeader) {
    const declaredLength = Number(declaredHeader);
    if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
      throw new UploadValidationError("Content-Length is invalid.");
    }
    if (declaredLength > MAX_UPLOAD_REQUEST_BYTES) {
      throw new UploadValidationError("Upload request is too large.", 413);
    }
  }
}

export async function readBoundedMultipartForm(request: NextRequest): Promise<FormData> {
  validateMultipartHeaders(request);
  const contentType = request.headers.get("content-type") || "";
  if (!request.body) throw new UploadValidationError("A multipart request body is required.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_UPLOAD_REQUEST_BYTES) {
        await reader.cancel();
        throw new UploadValidationError("Upload request is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return await new Response(bytes.buffer, { headers: { "Content-Type": contentType } }).formData();
  } catch {
    throw new UploadValidationError("The multipart request body is invalid.");
  }
}

function botFailure(result: Exclude<TurnstileResult, { ok: true }>) {
  if (result.code === "NOT_CONFIGURED") {
    return json(
      { ok: false, code: "BOT_PROTECTION_NOT_CONFIGURED", error: "Secure uploads are temporarily unavailable." },
      503,
    );
  }
  if (result.code === "UNAVAILABLE") {
    return json(
      { ok: false, code: "BOT_PROTECTION_UNAVAILABLE", error: "Bot verification is temporarily unavailable. Please try again." },
      503,
    );
  }
  return json(
    { ok: false, code: "BOT_VERIFICATION_FAILED", error: "Please complete bot verification and try again." },
    400,
  );
}

const defaultDependencies: UploadIntakeDependencies = {
  assertGrantConfigured: assertUploadVerificationGrantConfigured,
  verifyBot: verifyTurnstile,
  readForm: readBoundedMultipartForm,
  storeUpload: intakeUpload,
};

export async function handleUploadIntake(
  request: NextRequest,
  dependencies: UploadIntakeDependencies = defaultDependencies,
) {
  if (process.env.PUBLIC_ENQUIRIES_ENABLED === "false") {
    return json(
      { ok: false, code: "ENQUIRIES_DISABLED", error: "Secure uploads are temporarily unavailable." },
      503,
    );
  }
  if (!isAllowedEnquiryOrigin(request)) {
    return json({ ok: false, error: "This upload origin is not allowed." }, 403);
  }
  const ip = clientAddress(request);
  if (process.env.NODE_ENV === "production" && ip === "unknown") {
    return json(
      {
        ok: false,
        code: "TRUSTED_CLIENT_IP_NOT_CONFIGURED",
        error: "Secure uploads are temporarily unavailable.",
      },
      503,
    );
  }
  const agent = request.headers.get("user-agent")?.slice(0, 500) || "unknown";
  const rateLimit = consumeRateLimit(
    getNamespacedClientKey("upload", sha256(`${ip}:${agent}`).slice(0, 32)),
    { maxRequests: 5, windowMs: 60 * 60_000 },
  );
  if (rateLimit.limited) {
    return NextResponse.json(
      { ok: false, error: "Too many uploads. Please try again later." },
      { status: 429, headers: { ...headers, "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  try {
    // Reject known-invalid request headers before spending a single-use Turnstile response.
    validateMultipartHeaders(request);
    // The signing key and bot challenge are checked before the multipart stream is read.
    dependencies.assertGrantConfigured();
    const turnstileToken = request.headers.get(UPLOAD_TURNSTILE_HEADER)?.trim();
    if (turnstileToken && turnstileToken.length > 2048) {
      throw new UploadValidationError("Bot verification token is invalid.");
    }
    const bot = await dependencies.verifyBot(turnstileToken || undefined, ip);
    if (!bot.ok) return botFailure(bot);

    const form = await dependencies.readForm(request);
    const purpose = parseUploadPurpose(form.get("purpose"));
    const files = form.getAll("file");
    if (files.length !== 1 || !(files[0] instanceof File)) {
      throw new UploadValidationError("Exactly one file is required.");
    }
    const file = files[0];
    const upload = await dependencies.storeUpload(file, purpose, { ip, userAgent: agent });
    return json({ ok: true, upload }, 201);
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return json({ ok: false, error: error.message }, error.status);
    }
    if (error instanceof UploadNotConfiguredError) {
      return json(
        { ok: false, code: "UPLOADS_NOT_CONFIGURED", error: "Secure uploads are temporarily unavailable." },
        503,
      );
    }
    if (error instanceof UploadGrantConfigurationError) {
      return json(
        {
          ok: false,
          code: "UPLOAD_GRANTS_NOT_CONFIGURED",
          error: "Secure uploads are temporarily unavailable.",
        },
        503,
      );
    }
    return json({ ok: false, error: "The upload could not be accepted securely." }, 503);
  }
}

export async function POST(request: NextRequest) {
  return handleUploadIntake(request);
}
