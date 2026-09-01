import { AdminRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin/auth";
import {
  CatalogMediaCleanupError,
  CatalogMediaConfigurationError,
  CatalogMediaIntakeError,
  intakeCatalogProductMedia,
} from "@/lib/admin/catalog-media-intake";
import {
  CatalogMediaRequestError,
  isSameOriginAdminRequest,
  readBoundedCatalogMultipartForm,
  requireSingleFileField,
  requireSingleTextField,
} from "@/lib/admin/catalog-media-http";
import {
  CatalogManagementError,
  catalogManagementNotice,
} from "@/lib/admin/catalog-management";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectToCatalog(request: NextRequest, notice: string): NextResponse {
  const destination = new URL("/admin/catalog", request.nextUrl);
  destination.searchParams.set("notice", notice.slice(0, 80));
  const response = NextResponse.redirect(destination, 303);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

function redirectToSignIn(request: NextRequest): NextResponse {
  const destination = new URL("/admin/sign-in", request.nextUrl);
  destination.searchParams.set("reason", "unauthorized");
  const response = NextResponse.redirect(destination, 303);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

function intakeNotice(error: unknown): string {
  if (error instanceof CatalogMediaRequestError) {
    if (error.status === 413) return "media_upload_too_large";
    if (error.status === 415) return "media_upload_unsupported";
    return "media_upload_invalid";
  }
  if (error instanceof CatalogMediaIntakeError) {
    if (error.code === "FILE_TOO_LARGE") return "media_upload_too_large";
    if (error.code === "UNSUPPORTED_MEDIA") return "media_upload_unsupported";
    return "media_upload_invalid";
  }
  if (error instanceof CatalogMediaConfigurationError) {
    return "media_upload_unavailable";
  }
  if (error instanceof CatalogMediaCleanupError) {
    return "media_upload_cleanup_failed";
  }
  if (error instanceof CatalogManagementError || error instanceof z.ZodError) {
    return catalogManagementNotice(error);
  }
  return "media_upload_failed";
}

export async function POST(request: NextRequest) {
  if (!isSameOriginAdminRequest(request)) {
    return redirectToCatalog(request, "media_upload_origin_rejected");
  }

  let admin: Awaited<ReturnType<typeof getCurrentAdmin>>;
  try {
    admin = await getCurrentAdmin();
  } catch {
    return redirectToCatalog(request, "media_upload_unavailable");
  }
  if (!admin) return redirectToSignIn(request);
  if (admin.role !== AdminRole.OWNER) {
    return redirectToCatalog(request, "owner_required");
  }

  try {
    const form = await readBoundedCatalogMultipartForm(request);
    if (requireSingleTextField(form, "confirmation") !== "unverified_media_intake") {
      throw new CatalogMediaRequestError("Explicit Owner confirmation is required.", 400);
    }
    await intakeCatalogProductMedia({
      actor: admin,
      productId: requireSingleTextField(form, "hearingAidId"),
      file: requireSingleFileField(form, "file"),
      altText: requireSingleTextField(form, "altText"),
      sourceUrl: requireSingleTextField(form, "sourceUrl"),
    });
    return redirectToCatalog(request, "media_uploaded_unverified");
  } catch (error) {
    return redirectToCatalog(request, intakeNotice(error));
  }
}
