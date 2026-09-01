import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const GOOGLE_BUSINESS_STATE_COOKIE = "audiosen_gbp_oauth_state";
export const GOOGLE_BUSINESS_STATE_TTL_SECONDS = 10 * 60;

type StatePayload = {
  adminId: string;
  expiresAt: number;
  nonce: string;
};

function stateSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("Admin authentication is not configured.");
  return secret;
}

function signature(payload: string): string {
  return createHmac("sha256", stateSecret()).update(payload).digest("base64url");
}

export function createGoogleBusinessOAuthState(adminId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      adminId,
      expiresAt: Date.now() + GOOGLE_BUSINESS_STATE_TTL_SECONDS * 1000,
      nonce: randomBytes(24).toString("base64url"),
    } satisfies StatePayload),
  ).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyGoogleBusinessOAuthState(token: string, adminId: string): boolean {
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) return false;

  const expectedSignature = signature(payload);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as StatePayload;
    return (
      decoded.adminId === adminId &&
      Number.isFinite(decoded.expiresAt) &&
      decoded.expiresAt > Date.now() &&
      decoded.expiresAt <= Date.now() + GOOGLE_BUSINESS_STATE_TTL_SECONDS * 1000 &&
      typeof decoded.nonce === "string" &&
      decoded.nonce.length >= 24
    );
  } catch {
    return false;
  }
}
