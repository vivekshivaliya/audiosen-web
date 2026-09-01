import { EnquiryStatus } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@/lib/db";
import { decryptEnquiryPayload } from "@/lib/enquiries/encryption";
import {
  addEnquiryNote,
  retryEnquiryEmail,
  scheduleEnquiryFollowUp,
  updateEnquiryStatus,
} from "@/app/admin/(protected)/enquiries/actions";

export const dynamic = "force-dynamic";

type SensitiveEnquiry = {
  message?: string;
  hearingConcern?: string;
  details?: Record<string, unknown>;
  finderPreferences?: Record<string, unknown>;
};

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

function decryptSensitive(
  value: { ciphertext: string; nonce: string; authTag: string; keyVersion: string } | null,
): SensitiveEnquiry | null {
  if (!value) return null;
  try {
    return decryptEnquiryPayload<SensitiveEnquiry>(value);
  } catch {
    return null;
  }
}

function decryptText(value: {
  ciphertext: string;
  nonce: string;
  authTag: string;
  keyVersion: string;
}, key: "body" | "note"): string {
  try {
    return decryptEnquiryPayload<Record<string, string>>(value)[key] || "";
  } catch {
    return "Encrypted content is unavailable with the active keyring.";
  }
}

export default async function AdminEnquiryDetailPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const enquiry = await getPrisma().enquiry.findUnique({
    where: { reference: reference.slice(0, 32) },
    include: {
      sensitiveData: true,
      attachments: { orderBy: { createdAt: "asc" } },
      notes: { include: { author: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } },
      followUps: { include: { assignedTo: { select: { name: true, email: true } } }, orderBy: { dueAt: "asc" } },
      outbox: { select: { id: true, kind: true, status: true, attemptCount: true, sentAt: true, lastErrorCode: true, providerMessageId: true, providerStatus: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!enquiry) notFound();
  const sensitive = decryptSensitive(enquiry.sensitiveData);
  const digits = enquiry.phone.replace(/\D/g, "");

  return (
    <section>
      <Link href="/admin/enquiries" className="text-sm font-bold text-sky-300">← All enquiries</Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <article className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-widest text-sky-400">{enquiry.reference}</p><h1 className="mt-2 text-3xl font-bold text-white">{enquiry.name}</h1><p className="mt-1 text-slate-400">{enquiry.service} · {label(enquiry.type)}</p></div>
              <span className="rounded-full bg-slate-800 px-3 py-1.5 text-sm font-bold">{label(enquiry.status)}</span>
            </div>
            <dl className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Phone", enquiry.phone], ["Email", enquiry.email || "Not supplied"], ["City", enquiry.city],
                ["Age", enquiry.age ?? enquiry.ageGroup ?? "Not supplied"], ["Brand", enquiry.selectedBrand || "Not supplied"],
                ["Device", enquiry.selectedDevice || "Not supplied"], ["Source", enquiry.source], ["Source page", enquiry.sourcePath],
                ["Received", formatDate(enquiry.createdAt)],
              ].map(([term, value]) => <div key={String(term)}><dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{term}</dt><dd className="mt-1 break-words text-slate-100">{String(value)}</dd></div>)}
            </dl>
            <div className="mt-6 flex flex-wrap gap-2"><a className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold" href={`tel:${digits}`}>Call patient</a><a className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold" href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer">WhatsApp</a>{enquiry.email ? <a className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold" href={`mailto:${enquiry.email}`}>Email</a> : null}</div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-7">
            <h2 className="text-xl font-bold text-white">Sensitive details</h2>
            {enquiry.sensitiveData && !sensitive ? <p role="alert" className="mt-4 rounded-xl bg-amber-400/10 p-4 text-sm text-amber-200">Encrypted details cannot be decrypted with the configured keyring. Restore the matching key version; do not overwrite the record.</p> : null}
            <div className="mt-4 space-y-4 text-sm leading-6 text-slate-300">
              <div><h3 className="font-bold text-slate-100">Hearing concern</h3><p className="whitespace-pre-wrap">{sensitive?.hearingConcern || "Not supplied"}</p></div>
              <div><h3 className="font-bold text-slate-100">Message</h3><p className="whitespace-pre-wrap">{sensitive?.message || "Not supplied"}</p></div>
              {sensitive?.details || sensitive?.finderPreferences ? <div><h3 className="font-bold text-slate-100">Structured details</h3><pre className="mt-2 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-300">{JSON.stringify({ details: sensitive.details, finderPreferences: sensitive.finderPreferences }, null, 2)}</pre></div> : null}
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-7">
            <h2 className="text-xl font-bold text-white">Notes</h2>
            <form action={addEnquiryNote} className="mt-4 grid gap-3"><input type="hidden" name="enquiryId" value={enquiry.id} /><textarea required name="body" maxLength={4000} rows={3} placeholder="Add a private encrypted note" className="rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white" /><button type="submit" className="w-fit rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold">Add note</button></form>
            <div className="mt-6 space-y-3">{enquiry.notes.map((note) => <div key={note.id} className="rounded-xl bg-slate-950 p-4"><p className="whitespace-pre-wrap text-sm text-slate-200">{decryptText({ ciphertext: note.bodyCiphertext, nonce: note.bodyNonce, authTag: note.bodyAuthTag, keyVersion: note.keyVersion }, "body")}</p><p className="mt-2 text-xs text-slate-500">{note.author.name || note.author.email} · {formatDate(note.createdAt)}</p></div>)}{!enquiry.notes.length ? <p className="text-sm text-slate-500">No notes yet.</p> : null}</div>
          </article>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-white/10 bg-slate-900 p-5"><h2 className="font-bold text-white">Update status</h2><form action={updateEnquiryStatus} className="mt-3 grid gap-3"><input type="hidden" name="enquiryId" value={enquiry.id} /><select name="status" defaultValue={enquiry.status} className="rounded-xl border border-white/10 bg-slate-950 p-3 text-sm">{Object.values(EnquiryStatus).map((status) => <option key={status} value={status}>{label(status)}</option>)}</select><button type="submit" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold">Save status</button></form></section>
          <section className="rounded-2xl border border-white/10 bg-slate-900 p-5"><h2 className="font-bold text-white">Schedule follow-up</h2><form action={scheduleEnquiryFollowUp} className="mt-3 grid gap-3"><input type="hidden" name="enquiryId" value={enquiry.id} /><label className="text-xs font-bold text-slate-400">Date and time (India)<input required name="dueAt" type="datetime-local" className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm text-white" /></label><textarea name="note" maxLength={1000} rows={2} placeholder="Encrypted note (optional)" className="rounded-xl border border-white/10 bg-slate-950 p-3 text-sm" /><button type="submit" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold">Schedule</button></form><div className="mt-4 space-y-2">{enquiry.followUps.map((item) => <div key={item.id} className="rounded-xl bg-slate-950 p-3 text-xs text-slate-300"><strong>{formatDate(item.dueAt)}</strong><div>{label(item.status)} · {item.assignedTo?.name || item.assignedTo?.email || "Unassigned"}</div>{item.noteCiphertext && item.noteNonce && item.noteAuthTag && item.keyVersion ? <p className="mt-2 text-slate-400">{decryptText({ ciphertext: item.noteCiphertext, nonce: item.noteNonce, authTag: item.noteAuthTag, keyVersion: item.keyVersion }, "note")}</p> : null}</div>)}</div></section>
            <section className="rounded-2xl border border-white/10 bg-slate-900 p-5"><h2 className="font-bold text-white">Attachments</h2><div className="mt-3 space-y-2">{enquiry.attachments.map((file) => <div key={file.id} className="rounded-xl bg-slate-950 p-3 text-xs"><div className="break-all font-semibold text-slate-200">{file.originalName}</div><div className="mt-1 text-slate-500">{label(file.purpose)} · {label(file.scanStatus)} · {Math.ceil(file.sizeBytes / 1024)} KB</div>{file.scanStatus !== "CLEAN" ? <div className="mt-1 text-amber-300">Access remains blocked until malware scanning and metadata stripping mark this file clean.</div> : <a href={`/api/admin/attachments/${file.id}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center rounded-lg border border-emerald-400/30 px-3 py-2 font-bold text-emerald-300">Open clean private attachment</a>}</div>)}{!enquiry.attachments.length ? <p className="text-sm text-slate-500">No attachments.</p> : null}</div></section>
          <section className="rounded-2xl border border-white/10 bg-slate-900 p-5"><h2 className="font-bold text-white">Email outbox</h2><div className="mt-3 space-y-2">{enquiry.outbox.map((mail) => <div key={mail.id} className="rounded-xl bg-slate-950 p-3 text-xs text-slate-300"><strong>{label(mail.kind)}</strong><div>{label(mail.status)} · {mail.attemptCount} attempt(s)</div>{mail.providerStatus ? <div>ACS: {label(mail.providerStatus)}{mail.providerMessageId ? ` · ${mail.providerMessageId}` : ""}</div> : null}{mail.lastErrorCode ? <div className="text-amber-300">Code: {mail.lastErrorCode}</div> : null}{mail.status === "FAILED" || mail.status === "DEAD" ? <form action={retryEnquiryEmail} className="mt-2"><input type="hidden" name="outboxId" value={mail.id} /><button type="submit" className="min-h-11 rounded-lg border border-amber-400/30 px-3 py-2 font-bold text-amber-200">Queue manual retry</button></form> : null}</div>)}</div></section>
        </aside>
      </div>
    </section>
  );
}
