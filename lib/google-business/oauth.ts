import { GOOGLE_BUSINESS_SCOPE } from "@/lib/google-business/types";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export class GoogleBusinessOAuthConfigurationError extends Error {
  constructor() {
    super("Google Business owner authorization is not configured.");
    this.name = "GoogleBusinessOAuthConfigurationError";
  }
}

function oauthConfiguration() {
  const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_BUSINESS_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) {
    throw new GoogleBusinessOAuthConfigurationError();
  }
  const parsed = new URL(redirectUri);
  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    throw new GoogleBusinessOAuthConfigurationError();
  }
  return { clientId, clientSecret, redirectUri: parsed.toString() };
}

export function isGoogleBusinessOAuthConfigured(): boolean {
  try {
    oauthConfiguration();
    return true;
  } catch {
    return false;
  }
}

export function googleBusinessAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = oauthConfiguration();
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", `openid email ${GOOGLE_BUSINESS_SCOPE}`);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  return url.toString();
}

type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

async function tokenRequest(parameters: URLSearchParams): Promise<GoogleTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: parameters,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("Google Business authorization could not be completed.");
  const token = (await response.json()) as Partial<GoogleTokenResponse>;
  if (!token.access_token) throw new Error("Google Business did not return an access token.");
  return token as GoogleTokenResponse;
}

export async function exchangeGoogleBusinessCode(code: string) {
  const { clientId, clientSecret, redirectUri } = oauthConfiguration();
  return tokenRequest(
    new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  );
}

export async function refreshGoogleBusinessAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = oauthConfiguration();
  return tokenRequest(
    new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  );
}

export async function getGoogleOAuthIdentity(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("The Google account identity could not be verified.");
  const identity = (await response.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
  };
  if (!identity.sub || !identity.email || identity.email_verified !== true) {
    throw new Error("The Google account identity is incomplete.");
  }
  return { subject: identity.sub, email: identity.email.toLowerCase() };
}
