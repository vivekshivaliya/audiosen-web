import { AttachmentScanStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { getPrisma } from "@/lib/db";
import { getPrivateUploadContainer } from "@/lib/uploads/intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function unavailable() {
  return NextResponse.json(
    { ok: false, error: "The clean attachment is unavailable." },
    {
      status: 404,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const admin = await requireAdmin();
  const attachmentId = z.string().uuid().safeParse((await context.params).id);
  if (!attachmentId.success) return unavailable();

  const attachment = await getPrisma().enquiryAttachment.findFirst({
    where: {
      id: attachmentId.data,
      enquiryId: { not: null },
      scanStatus: AttachmentScanStatus.CLEAN,
    },
  });
  if (
    !attachment ||
    !attachment.storageKey.startsWith("clean/") ||
    attachment.sizeBytes < 1 ||
    attachment.sizeBytes > 10 * 1024 * 1024
  ) {
    return unavailable();
  }

  try {
    const blob = (await getPrivateUploadContainer()).getBlockBlobClient(attachment.storageKey);
    const bytes = await blob.downloadToBuffer(0, attachment.sizeBytes);
    await getPrisma().auditLog.create({
      data: {
        actorId: admin.id,
        action: "enquiry.attachment_viewed",
        entityType: "EnquiryAttachment",
        entityId: attachment.id,
        metadata: { enquiryId: attachment.enquiryId, purpose: attachment.purpose },
      },
    });
    const encodedName = encodeURIComponent(attachment.originalName).replaceAll("'", "%27");
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `inline; filename="audiosen-attachment"; filename*=UTF-8''${encodedName}`,
        "Content-Length": String(bytes.byteLength),
        "Content-Type": attachment.contentType,
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Cross-Origin-Resource-Policy": "same-origin",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "The clean attachment is temporarily unavailable." },
      {
        status: 503,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          "Retry-After": "60",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  }
}
