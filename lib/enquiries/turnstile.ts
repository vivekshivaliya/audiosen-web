export type TurnstileResult =
  | { ok: true }
  | { ok: false; code: "NOT_CONFIGURED" | "TOKEN_REQUIRED" | "VERIFICATION_FAILED" | "UNAVAILABLE" };

type SiteverifyResponse = {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

function productionPublicFormsEnabled(): boolean {
  return process.env.NODE_ENV === "production" && process.env.PUBLIC_ENQUIRIES_ENABLED !== "false";
}

export async function verifyTurnstile(
  token: string | undefined,
  remoteIp: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const officialTestSecret = "1x0000000000000000000000000000000AA";
  const stagingTestMode =
    process.env.AUDIOSEN_STAGING_DEPLOYMENT === "true" && secret === officialTestSecret;
  const required = productionPublicFormsEnabled() || process.env.TURNSTILE_REQUIRED === "true";
  if (!secret) return required ? { ok: false, code: "NOT_CONFIGURED" } : { ok: true };
  if (!token) return { ok: false, code: "TOKEN_REQUIRED" };

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp !== "unknown") body.set("remoteip", remoteIp);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return { ok: false, code: "UNAVAILABLE" };
    const result = (await response.json()) as SiteverifyResponse;
    if (!result.success) return { ok: false, code: "VERIFICATION_FAILED" };

    const expectedAction = process.env.TURNSTILE_EXPECTED_ACTION?.trim() || "enquiry_submit";
    if (!stagingTestMode && result.action !== expectedAction) {
      return { ok: false, code: "VERIFICATION_FAILED" };
    }

    const allowedHostnames = (process.env.TURNSTILE_ALLOWED_HOSTNAMES || "audiosen.com,www.audiosen.com")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    if (
      process.env.NODE_ENV === "production" &&
      (!result.hostname || !allowedHostnames.includes(result.hostname.toLowerCase()))
    ) {
      return { ok: false, code: "VERIFICATION_FAILED" };
    }
    return { ok: true };
  } catch {
    return { ok: false, code: "UNAVAILABLE" };
  } finally {
    clearTimeout(timeout);
  }
}
