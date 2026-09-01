import { randomBytes } from "node:crypto";
import { AdminRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { googleBusinessAuthorizationUrl } from "@/lib/google-business/oauth";
import {
  createGoogleBusinessOAuthState,
  GOOGLE_BUSINESS_STATE_COOKIE,
  GOOGLE_BUSINESS_STATE_TTL_SECONDS,
} from "@/lib/google-business/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin([AdminRole.OWNER]);
  const state = createGoogleBusinessOAuthState(admin.id);
  const response = NextResponse.redirect(googleBusinessAuthorizationUrl(state));
  response.cookies.set(GOOGLE_BUSINESS_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/google-business/callback",
    maxAge: GOOGLE_BUSINESS_STATE_TTL_SECONDS,
  });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-OAuth-Request-Id", randomBytes(8).toString("hex"));
  return response;
}
