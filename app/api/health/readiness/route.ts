import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
};

function secretMatches(received: string, configured: string): boolean {
  const left = Buffer.from(received);
  const right = Buffer.from(configured);
  return left.length === right.length && timingSafeEqual(left, right);
}

function configurationReady(): boolean {
  const requiredValues = [
    process.env.DATABASE_URL,
    process.env.AUTH_SECRET,
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET,
    process.env.ADMIN_EMAIL_ALLOWLIST,
    process.env.ADMIN_OWNER_EMAIL,
    process.env.ENQUIRY_FIELD_ENCRYPTION_KEY ?? process.env.ENQUIRY_FIELD_ENCRYPTION_KEYS,
    process.env.IP_HASH_SECRET,
    process.env.THANK_YOU_CONTEXT_SECRET,
    process.env.UPLOAD_VERIFICATION_GRANT_SECRET,
    process.env.TURNSTILE_SECRET_KEY,
    process.env.TURNSTILE_ALLOWED_HOSTNAMES,
    process.env.ENQUIRY_ALLOWED_ORIGINS,
    process.env.AZURE_BLOB_SERVICE_URL,
    process.env.AZURE_BLOB_CONTAINER,
    process.env.GOOGLE_BUSINESS_CLIENT_ID,
    process.env.GOOGLE_BUSINESS_CLIENT_SECRET,
    process.env.GOOGLE_BUSINESS_REDIRECT_URI,
    process.env.GOOGLE_BUSINESS_KEY_VAULT_URL,
    process.env.EMAIL_OUTBOX_WORKER_READINESS_URL,
    process.env.EMAIL_OUTBOX_WORKER_READINESS_KEY,
  ];
  const emailEndpointConfigured = Boolean(
    process.env.AZURE_COMMUNICATION_EMAIL_ENDPOINT?.trim(),
  );
  const emailConnectionStringConfigured = Boolean(
    process.env.AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING?.trim(),
  );
  const emailTransportConfigured =
    emailEndpointConfigured !== emailConnectionStringConfigured;
  return Boolean(
    requiredValues.every((value) => value?.trim()) &&
      process.env.PUBLIC_ENQUIRIES_ENABLED === "true" &&
      process.env.LEGAL_CONTENT_APPROVED === "true" &&
      process.env.TRUST_CLOUDFLARE_IP === "true" &&
      process.env.TRUST_PROXY_HEADERS === "true" &&
      process.env.UPLOAD_SCAN_RESULT_MODE === "defender-tags" &&
      process.env.AZURE_COMMUNICATION_EMAIL_SENDER === "support@audiosen.com" &&
      emailTransportConfigured &&
      /^G-[A-Z0-9]+$/i.test(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim() ?? "") &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
  );
}

async function workerReady(): Promise<boolean> {
  const url = process.env.EMAIL_OUTBOX_WORKER_READINESS_URL?.trim();
  const key = process.env.EMAIL_OUTBOX_WORKER_READINESS_KEY?.trim();
  if (!url || !key) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  try {
    const response = await fetch(parsed, {
      headers: { "x-functions-key": key },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return false;
    const payload = (await response.json()) as { ok?: unknown };
    return payload.ok === true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const configuredSecret = process.env.READINESS_PROBE_SECRET?.trim() ?? "";
  const receivedSecret = request.headers.get("x-audiosen-readiness-key") ?? "";
  if (
    configuredSecret.length < 32 ||
    receivedSecret.length < 32 ||
    !secretMatches(receivedSecret, configuredSecret)
  ) {
    return new NextResponse(null, { status: 404, headers: noStoreHeaders });
  }
  if (!configurationReady() || !isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, service: "audiosen-web-readiness" },
      { status: 503, headers: noStoreHeaders },
    );
  }

  try {
    const [, outboxWorkerReady] = await Promise.all([
      getPrisma().$queryRaw`SELECT 1`,
      workerReady(),
    ]);
    if (!outboxWorkerReady) throw new Error("Outbox worker is not ready.");
    return NextResponse.json(
      { ok: true, service: "audiosen-web-readiness" },
      { status: 200, headers: noStoreHeaders },
    );
  } catch {
    return NextResponse.json(
      { ok: false, service: "audiosen-web-readiness" },
      { status: 503, headers: noStoreHeaders },
    );
  }
}
