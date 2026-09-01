import { createHash, createHmac, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";

export const MAX_ENQUIRY_BODY_BYTES = 48 * 1024;

export class BodyTooLargeError extends Error {
  constructor() {
    super("Request body is too large.");
    this.name = "BodyTooLargeError";
  }
}

export async function readJsonBody(request: NextRequest): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_ENQUIRY_BODY_BYTES) {
    throw new BodyTooLargeError();
  }

  if (!request.body) return null;

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_ENQUIRY_BODY_BYTES) {
        await reader.cancel();
        throw new BodyTooLargeError();
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  return JSON.parse(body);
}

function configuredOrigins(): Set<string> {
  const configured = (process.env.ENQUIRY_ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return new Set(["https://audiosen.com", "https://www.audiosen.com", ...configured]);
}

export function isAllowedEnquiryOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return process.env.NODE_ENV !== "production" || process.env.ENQUIRY_ALLOW_MISSING_ORIGIN === "true";
  }

  let normalized: string;
  try {
    normalized = new URL(origin).origin;
  } catch {
    return false;
  }

  if (configuredOrigins().has(normalized)) return true;

  if (process.env.NODE_ENV !== "production") {
    const url = new URL(normalized);
    return (
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      (url.protocol === "http:" || url.protocol === "https:")
    );
  }

  return false;
}

export function clientAddress(request: NextRequest): string {
  if (process.env.TRUST_CLOUDFLARE_IP === "true") {
    const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
    if (cloudflareIp) return cloudflareIp;
  }

  if (process.env.TRUST_PROXY_HEADERS === "true") {
    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;

    const forwarded = request.headers
      .get("x-forwarded-for")
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (forwarded?.length) return forwarded.at(-1) || "unknown";
  }

  return "unknown";
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function privacySafeIpHash(ip: string): string | undefined {
  if (ip === "unknown") return undefined;
  const secret = process.env.IP_HASH_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (!secret) return undefined;
  return createHmac("sha256", secret).update(ip).digest("hex");
}

export function generatedIdempotencyKey(fingerprint: string, clientKey: string): string {
  const fiveMinuteBucket = Math.floor(Date.now() / 300_000);
  return `auto:${sha256(`${fingerprint}:${clientKey}:${fiveMinuteBucket}`)}`;
}

export function generatedPublicReference(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let suffix = "";
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
  return `AUD-${date}-${suffix}`;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, stableValue(child)]),
    );
  }
  return value;
}

export function requestFingerprint(value: unknown): string {
  return sha256(JSON.stringify(stableValue(value)));
}
