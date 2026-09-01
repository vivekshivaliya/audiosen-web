import { randomUUID, timingSafeEqual } from "node:crypto";
import { AdminRole, GoogleConnectionStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getPrisma } from "@/lib/db";
import {
  exchangeGoogleBusinessCode,
  getGoogleOAuthIdentity,
} from "@/lib/google-business/oauth";
import {
  GOOGLE_BUSINESS_STATE_COOKIE,
  verifyGoogleBusinessOAuthState,
} from "@/lib/google-business/state";
import { storeGoogleBusinessRefreshToken } from "@/lib/google-business/token-vault";
import { GOOGLE_BUSINESS_SCOPE } from "@/lib/google-business/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function equalState(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function resultRedirect(request: NextRequest, result: string) {
  const response = NextResponse.redirect(
    new URL(`/admin/google-business?notice=${encodeURIComponent(result)}`, request.url),
  );
  response.cookies.set(GOOGLE_BUSINESS_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/google-business/callback",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  const state = request.nextUrl.searchParams.get("state") || "";
  const stateCookie = request.cookies.get(GOOGLE_BUSINESS_STATE_COOKIE)?.value || "";
  const code = request.nextUrl.searchParams.get("code") || "";
  if (
    request.nextUrl.searchParams.has("error") ||
    !state ||
    !stateCookie ||
    !equalState(state, stateCookie) ||
    !verifyGoogleBusinessOAuthState(state, admin.id)
  ) {
    return resultRedirect(request, "authorization_rejected");
  }
  if (!code || code.length > 4096) return resultRedirect(request, "authorization_rejected");

  try {
    const token = await exchangeGoogleBusinessCode(code);
    const scopes = new Set((token.scope || "").split(/\s+/).filter(Boolean));
    if (!scopes.has(GOOGLE_BUSINESS_SCOPE)) {
      return resultRedirect(request, "business_scope_missing");
    }
    const identity = await getGoogleOAuthIdentity(token.access_token);
    const existing = await getPrisma().googleConnection.findFirst({
      where: { googleSubject: identity.subject },
      orderBy: { updatedAt: "desc" },
    });
    if (!token.refresh_token && !existing) {
      return resultRedirect(request, "refresh_token_missing");
    }

    const connectionId = existing?.id ?? randomUUID();
    const stored = token.refresh_token
      ? await storeGoogleBusinessRefreshToken(connectionId, token.refresh_token)
      : {
          reference: existing!.encryptedRefreshToken,
          keyVersion: existing!.tokenKeyVersion,
        };
    const expiresAt = token.expires_in
      ? new Date(Date.now() + Math.max(token.expires_in - 60, 60) * 1000)
      : null;

    await getPrisma().$transaction(async (transaction) => {
      if (existing) {
        await transaction.googleConnection.update({
          where: { id: existing.id },
          data: {
            connectedById: admin.id,
            encryptedRefreshToken: stored.reference,
            tokenKeyVersion: stored.keyVersion,
            scopes: [...scopes],
            status: GoogleConnectionStatus.ACTIVE,
            expiresAt,
          },
        });
      } else {
        await transaction.googleConnection.create({
          data: {
            id: connectionId,
            connectedById: admin.id,
            googleSubject: identity.subject,
            encryptedRefreshToken: stored.reference,
            tokenKeyVersion: stored.keyVersion,
            scopes: [...scopes],
            status: GoogleConnectionStatus.ACTIVE,
            expiresAt,
          },
        });
      }
      await transaction.auditLog.create({
        data: {
          actorId: admin.id,
          action: existing
            ? "google_business.connection_reauthorized"
            : "google_business.connection_created",
          entityType: "GoogleConnection",
          entityId: connectionId,
          metadata: { scopes: [...scopes] },
        },
      });
    });
    return resultRedirect(request, "connected");
  } catch {
    return resultRedirect(request, "authorization_failed");
  }
}
