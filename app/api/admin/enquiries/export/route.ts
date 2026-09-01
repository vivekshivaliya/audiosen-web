import { AdminRole, EnquiryStatus, type Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeText(value: string | null, maximum = 160): string {
  return (value || "").trim().slice(0, maximum);
}

function safeDate(value: string | null): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function csvCell(value: unknown): string {
  let text = value instanceof Date ? value.toISOString() : String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin([AdminRole.OWNER, AdminRole.ADMIN]);
  const query = request.nextUrl.searchParams;
  const dateFrom = safeDate(query.get("dateFrom"));
  const dateTo = safeDate(query.get("dateTo"));
  if (dateTo) dateTo.setUTCDate(dateTo.getUTCDate() + 1);
  const statusValue = safeText(query.get("status"), 40).toUpperCase();
  const status = Object.values(EnquiryStatus).includes(statusValue as EnquiryStatus)
    ? (statusValue as EnquiryStatus)
    : undefined;
  const contains = (name: string): Prisma.StringFilter | undefined => {
    const value = safeText(query.get(name));
    return value ? { contains: value, mode: "insensitive" } : undefined;
  };
  const where: Prisma.EnquiryWhereInput = {
    status,
    source: contains("source"),
    service: contains("service"),
    selectedDevice: contains("device"),
    selectedBrand: contains("brand"),
    city: contains("city"),
    createdAt:
      dateFrom || dateTo
        ? { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lt: dateTo } : {}) }
        : undefined,
  };
  const rows = await getPrisma().enquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5_000,
    select: {
      reference: true,
      status: true,
      type: true,
      name: true,
      phone: true,
      email: true,
      city: true,
      age: true,
      ageGroup: true,
      service: true,
      selectedBrand: true,
      selectedDevice: true,
      source: true,
      sourcePath: true,
      createdAt: true,
    },
  });
  await getPrisma().auditLog.create({
    data: {
      actorId: admin.id,
      action: "enquiry.csv_exported",
      entityType: "EnquiryExport",
      metadata: {
        rowCount: rows.length,
        capped: rows.length === 5_000,
        filters: Object.fromEntries(
          ["dateFrom", "dateTo", "source", "service", "device", "brand", "city", "status"]
            .map((key) => [key, safeText(query.get(key))])
            .filter(([, value]) => value),
        ),
      },
    },
  });
  const headings = [
    "reference", "status", "type", "name", "phone", "email", "city", "age", "ageGroup",
    "service", "selectedBrand", "selectedDevice", "source", "sourcePath", "createdAt",
  ];
  const csv = [
    headings.map(csvCell).join(","),
    ...rows.map((row) => headings.map((heading) => csvCell(row[heading as keyof typeof row])).join(",")),
  ].join("\r\n");
  const filename = `audiosen-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
