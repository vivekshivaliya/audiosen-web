import type { Enquiry, EnquiryStatus, Prisma } from "@prisma/client";
import { EnquiryStatus as EnquiryStatusValues } from "@prisma/client";
import Link from "next/link";
import { getPrisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function text(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim().slice(0, 160) : "";
}

function dateValue(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function label(value: string): string {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const statusParam = text(params.status).toUpperCase();
  const status = Object.values(EnquiryStatusValues).includes(statusParam as EnquiryStatus)
    ? (statusParam as EnquiryStatus)
    : undefined;
  const dateFrom = dateValue(text(params.dateFrom));
  const dateTo = dateValue(text(params.dateTo));
  if (dateTo) dateTo.setUTCDate(dateTo.getUTCDate() + 1);

  const contains = (value: string): Prisma.StringFilter | undefined =>
    value ? { contains: value, mode: "insensitive" } : undefined;
  const where: Prisma.EnquiryWhereInput = {
    status,
    source: contains(text(params.source)),
    service: contains(text(params.service)),
    selectedDevice: contains(text(params.device)),
    selectedBrand: contains(text(params.brand)),
    city: contains(text(params.city)),
    createdAt:
      dateFrom || dateTo
        ? { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lt: dateTo } : {}) }
        : undefined,
  };
  const exportQuery = new URLSearchParams();
  for (const key of ["dateFrom", "dateTo", "source", "service", "device", "brand", "city", "status"]) {
    const value = text(params[key]);
    if (value) exportQuery.set(key, value);
  }

  let enquiries: Enquiry[] = [];
  let unavailable = false;
  try {
    enquiries = await getPrisma().enquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch {
    unavailable = true;
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Enquiries</h1>
          <p className="mt-1 text-sm text-slate-400">Latest 50 results · times shown in Asia/Kolkata</p>
        </div>
        <Link
          href={`/api/admin/enquiries/export${exportQuery.size ? `?${exportQuery.toString()}` : ""}`}
          className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold text-slate-200"
        >
          Export CSV (owner/admin)
        </Link>
      </div>

      <form className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-slate-900 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["dateFrom", "From date", "date"], ["dateTo", "To date", "date"],
          ["source", "Source", "text"], ["service", "Service", "text"],
          ["device", "Device", "text"], ["brand", "Brand", "text"], ["city", "City", "text"],
        ].map(([name, placeholder, type]) => (
          <input key={name} name={name} type={type} defaultValue={text(params[name])} placeholder={placeholder}
            aria-label={placeholder} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-500" />
        ))}
        <select name="status" defaultValue={status || ""} aria-label="Status"
          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white">
          <option value="">All statuses</option>
          {Object.values(EnquiryStatusValues).map((value) => <option key={value} value={value}>{label(value)}</option>)}
        </select>
        <button type="submit" className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-500">Apply filters</button>
        <Link href="/admin/enquiries" className="rounded-xl border border-white/15 px-4 py-2.5 text-center text-sm font-bold text-slate-200">Clear</Link>
      </form>

      {unavailable ? (
        <div role="alert" className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-amber-100">
          Enquiry data is temporarily unavailable. No database details have been exposed.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-800 text-xs uppercase tracking-wider text-slate-400">
              <tr><th className="p-4">Patient</th><th className="p-4">Request</th><th className="p-4">Status</th><th className="p-4">Received</th><th className="p-4">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {enquiries.map((enquiry) => {
                const digits = enquiry.phone.replace(/\D/g, "");
                return (
                  <tr key={enquiry.id} className="align-top hover:bg-white/[0.025]">
                    <td className="p-4"><Link href={`/admin/enquiries/${enquiry.reference}`} className="font-bold text-sky-300">{enquiry.name}</Link><div className="mt-1 text-slate-400">{enquiry.city} · {enquiry.phone}</div></td>
                    <td className="p-4"><div className="font-medium text-white">{enquiry.service}</div><div className="mt-1 text-slate-400">{enquiry.selectedBrand || "—"} {enquiry.selectedDevice || ""}</div><div className="mt-1 text-xs text-slate-500">{enquiry.reference}</div></td>
                    <td className="p-4"><span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-200">{label(enquiry.status)}</span></td>
                    <td className="whitespace-nowrap p-4 text-slate-300">{formatDate(enquiry.createdAt)}</td>
                    <td className="p-4"><div className="flex gap-2"><a className="rounded-lg border border-white/15 px-2.5 py-1.5" href={`tel:${digits}`}>Call</a><a className="rounded-lg border border-white/15 px-2.5 py-1.5" href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer">WhatsApp</a></div></td>
                  </tr>
                );
              })}
              {!enquiries.length ? <tr><td colSpan={5} className="p-8 text-center text-slate-400">No enquiries match these filters.</td></tr> : null}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
