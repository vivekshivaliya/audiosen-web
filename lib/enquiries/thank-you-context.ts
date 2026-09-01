import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const THANK_YOU_COOKIE = "audiosen_thanks";
export const THANK_YOU_COOKIE_MAX_AGE = 10 * 60;

export type ThankYouContext = {
  reference: string;
  service: string;
  selectedDevice?: string;
  expiresAt: number;
  nonce: string;
};

function signingSecret(): string | undefined {
  const configured =
    process.env.THANK_YOU_CONTEXT_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV !== "production") return "audiosen-local-thank-you-context-only";
  return undefined;
}

function signature(payload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payload).digest();
}

export function createThankYouContextToken(
  context: Omit<ThankYouContext, "expiresAt" | "nonce">,
): string | undefined {
  const secret = signingSecret();
  if (!secret) return undefined;
  const value: ThankYouContext = {
    ...context,
    expiresAt: Date.now() + THANK_YOU_COOKIE_MAX_AGE * 1000,
    nonce: randomBytes(16).toString("base64url"),
  };
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${payload}.${signature(payload, secret).toString("base64url")}`;
}

export function verifyThankYouContextToken(token: string | undefined): ThankYouContext | null {
  if (!token) return null;
  const secret = signingSecret();
  if (!secret) return null;
  const [payload, encodedSignature, ...rest] = token.split(".");
  if (!payload || !encodedSignature || rest.length > 0) return null;

  try {
    const supplied = Buffer.from(encodedSignature, "base64url");
    const expected = signature(payload, secret);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<ThankYouContext>;
    if (
      typeof parsed.reference !== "string" ||
      !/^AUD-\d{8}-[A-Z2-9]{8}$/.test(parsed.reference) ||
      typeof parsed.service !== "string" ||
      parsed.service.length < 2 ||
      parsed.service.length > 160 ||
      (parsed.selectedDevice !== undefined &&
        (typeof parsed.selectedDevice !== "string" || parsed.selectedDevice.length > 160)) ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt < Date.now() ||
      parsed.expiresAt > Date.now() + THANK_YOU_COOKIE_MAX_AGE * 1000 + 5_000 ||
      typeof parsed.nonce !== "string" ||
      parsed.nonce.length < 16
    ) {
      return null;
    }
    return parsed as ThankYouContext;
  } catch {
    return null;
  }
}
