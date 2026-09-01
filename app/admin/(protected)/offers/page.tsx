import type { Metadata } from "next";
import { AdminRole } from "@prisma/client";
import { requireAdmin } from "@/lib/admin/auth";
import {
  evaluateOfferPublicationGate,
  getReviewedProgramDefinition,
  reviewedProgramDefinitions,
} from "@/lib/admin/offer-gates";
import {
  offerGateInclude,
  offerStatusLabel,
  toOfferGateInput,
} from "@/lib/admin/offer-management";
import { getPrisma } from "@/lib/db";
import {
  createOfferDraftAction,
  setOfferEnabledAction,
  updateOfferDetailsAction,
  updateOfferMappingsAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Offer approvals | Audiosen Admin",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const notices: Record<string, { tone: "success" | "error"; message: string }> = {
  draft_created: { tone: "success", message: "The program was created as a disabled draft." },
  details_updated: {
    tone: "success",
    message: "Program details were saved. Any prior enablement was removed for re-approval.",
  },
  mappings_updated: {
    tone: "success",
    message: "Eligibility mappings were saved. Any prior enablement was removed for re-approval.",
  },
  publication_updated: { tone: "success", message: "The Owner publication decision was recorded." },
  owner_required: { tone: "error", message: "Only an active Owner can change offer records." },
  offer_not_found: { tone: "error", message: "That program no longer exists." },
  invalid_input: { tone: "error", message: "Review the fields and provide valid exact values." },
  no_change: { tone: "error", message: "That publication state is already selected." },
  gate_incomplete: {
    tone: "error",
    message: "Enablement is blocked until every displayed approval gate passes.",
  },
  slug_exists: { tone: "error", message: "A program already uses that slug." },
  change_failed: { tone: "error", message: "The program change could not be completed safely." },
};

function noticeValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.slice(0, 80) : "";
}

function indiaDateTimeInput(value: Date | null): string {
  if (!value) return "";
  return new Date(value.getTime() + 330 * 60_000).toISOString().slice(0, 16);
}

function formatDate(value: Date | null): string {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

export default async function AdminOffersPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin([AdminRole.OWNER, AdminRole.ADMIN]);
  const canMutate = admin.role === AdminRole.OWNER;
  const prisma = getPrisma();
  const [offers, brands, products, services] = await Promise.all([
    prisma.offer.findMany({
      orderBy: [{ enabled: "desc" }, { updatedAt: "desc" }],
      include: offerGateInclude,
    }),
    prisma.brand.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.hearingAid.findMany({
      orderBy: [{ brand: { sortOrder: "asc" } }, { sortOrder: "asc" }, { modelName: "asc" }],
      include: { brand: true },
    }),
    prisma.service.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  const params = await searchParams;
  const notice = notices[noticeValue(params.notice)];

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">Commercial approval control</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Offers and commercial programs</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Offers, rentals, care plans and trials stay disabled until exact products or services,
              dates, complete written terms, verified sources and Owner approval are recorded. Only
              the 50% campaign may record or display a discount. A brand-only mapping never establishes eligibility.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-300">
            {admin.role} · {canMutate ? "approval access" : "read only"}
          </span>
        </div>

        {notice ? (
          <div
            role={notice.tone === "error" ? "alert" : "status"}
            className={`mt-5 rounded-xl border p-4 text-sm ${
              notice.tone === "error"
                ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
                : "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
            }`}
          >
            {notice.message}
          </div>
        ) : null}
      </section>

      {canMutate ? (
        <section className="rounded-2xl border border-white/10 bg-slate-900 p-5">
          <h2 className="text-xl font-bold text-white">Create a reviewed V1 draft</h2>
          <form action={createOfferDraftAction} className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] md:items-end">
            <label className="grid gap-1 text-sm font-bold text-slate-200">
              Reviewed program surface
              <select name="slug" required className="min-h-11 rounded-lg border border-white/10 bg-slate-950 px-3 text-white">
                {Object.entries(reviewedProgramDefinitions).map(([slug, definition]) => (
                  <option key={slug} value={slug}>{definition.canonicalPath}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold text-slate-200">
              Public title
              <input name="title" required minLength={3} maxLength={180} placeholder="Exact approved program name" className="min-h-11 rounded-lg border border-white/10 bg-slate-950 px-3 text-white" />
              <span className="font-normal leading-5 text-slate-400">The 50% surface always stores the bounded title “Eligible for Up to 50% Off”.</span>
            </label>
            <button type="submit" className="min-h-11 rounded-lg bg-sky-600 px-5 text-sm font-bold text-white">Create draft</button>
          </form>
        </section>
      ) : null}

      <section className="grid gap-4" aria-labelledby="offers-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="offers-heading" className="text-xl font-bold text-white">Recorded programs</h2>
          <span className="text-sm text-slate-400">{offers.length} total</span>
        </div>

        {offers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900 p-8 text-sm text-slate-300">
            No programs are recorded. Public program pages remain in their safe unavailable state.
          </div>
        ) : null}

        {offers.map((offer) => {
          const programDefinition = getReviewedProgramDefinition(offer.slug);
          const gate = evaluateOfferPublicationGate(toOfferGateInput(offer));
          const selectedBrandIds = new Set(offer.brands.map(({ brandId }) => brandId));
          const selectedProductIds = new Set(offer.hearingAids.map(({ hearingAidId }) => hearingAidId));
          const selectedServiceIds = new Set(offer.services.map(({ serviceId }) => serviceId));
          return (
            <details key={offer.id} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 p-5 marker:content-none">
                <div>
                  <h3 className="text-lg font-bold text-white">{offer.title}</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {programDefinition?.canonicalPath ?? `Unsupported slug: ${offer.slug}`} · updated {formatDate(offer.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className={`rounded-full px-3 py-1.5 ${offer.enabled ? "bg-emerald-400/15 text-emerald-200" : "bg-slate-800 text-slate-200"}`}>
                    {offerStatusLabel(offer)}
                  </span>
                  <span className={`rounded-full px-3 py-1.5 ${gate.ready ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"}`}>
                    {gate.ready ? "Gate passed" : "Gate incomplete"}
                  </span>
                </div>
              </summary>

              <div className="grid gap-6 border-t border-white/10 p-5">
                <section className="rounded-xl border border-white/10 bg-slate-950 p-4">
                  <h4 className="font-bold text-white">Publication checklist</h4>
                  <ul className="mt-3 grid gap-2 text-xs">
                    {gate.checks.map((check) => (
                      <li key={check.key} className={`flex items-start gap-2 ${check.passed ? "text-emerald-200" : "text-amber-200"}`}>
                        <span aria-hidden="true" className="font-black">{check.passed ? "✓" : "×"}</span>
                        <span>{check.label}</span>
                        <span className="sr-only">: {check.passed ? "passed" : "not passed"}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <div className="grid gap-6 xl:grid-cols-2">
                  <section className="rounded-xl border border-white/10 bg-slate-950 p-4">
                    <h4 className="font-bold text-white">Program facts</h4>
                    <form action={updateOfferDetailsAction} className="mt-4 grid gap-3">
                      <input type="hidden" name="offerId" value={offer.id} />
                      <label className="grid gap-1 text-xs font-bold text-slate-200">
                        Public title
                        <input disabled={!canMutate} readOnly={programDefinition?.kind === "campaign"} name="title" required minLength={3} maxLength={180} defaultValue={programDefinition?.kind === "campaign" ? programDefinition.defaultTitle : offer.title} className="min-h-11 rounded-lg border border-white/10 bg-slate-900 px-3 text-white disabled:opacity-70 read-only:cursor-not-allowed read-only:opacity-80" />
                      </label>
                      {programDefinition?.exactDiscountPct === 50 ? (
                        <label className="grid gap-1 text-xs font-bold text-slate-200">
                          Exact maximum discount (must be 50%)
                          <input disabled={!canMutate} name="maximumDiscountPct" required type="number" min={50} max={50} step={1} defaultValue={offer.maximumDiscountPct ?? 50} className="min-h-11 rounded-lg border border-white/10 bg-slate-900 px-3 text-white disabled:opacity-70" />
                        </label>
                      ) : (
                        <div className="rounded-lg border border-white/10 bg-slate-900 p-3 text-xs leading-5 text-slate-300">
                          <input type="hidden" name="maximumDiscountPct" value="" />
                          <span className="font-bold text-white">Discount percentage:</span> not applicable. This program cannot be saved or published with a discount value.
                        </div>
                      )}
                      <label className="grid gap-1 text-xs font-bold text-slate-200">
                        Program summary
                        <textarea disabled={!canMutate} name="summary" required minLength={20} maxLength={4000} rows={3} defaultValue={offer.summary ?? ""} className="rounded-lg border border-white/10 bg-slate-900 p-3 text-white disabled:opacity-70" />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1 text-xs font-bold text-slate-200">
                          Starts (India time)
                          <input disabled={!canMutate} name="startsAt" required type="datetime-local" defaultValue={indiaDateTimeInput(offer.startsAt)} className="min-h-11 rounded-lg border border-white/10 bg-slate-900 px-3 text-white disabled:opacity-70" />
                        </label>
                        <label className="grid gap-1 text-xs font-bold text-slate-200">
                          Ends (India time)
                          <input disabled={!canMutate} name="endsAt" required type="datetime-local" defaultValue={indiaDateTimeInput(offer.endsAt)} className="min-h-11 rounded-lg border border-white/10 bg-slate-900 px-3 text-white disabled:opacity-70" />
                        </label>
                      </div>
                      <label className="grid gap-1 text-xs font-bold text-slate-200">
                        Complete written terms
                        <textarea disabled={!canMutate} name="terms" required minLength={120} maxLength={20000} rows={10} defaultValue={offer.terms ?? ""} placeholder={"Pricing: …\nDeposit: …\nWarranty: …\nTrial applicability: …\nEligibility: …\nDates: …"} className="rounded-lg border border-white/10 bg-slate-900 p-3 text-white disabled:opacity-70" />
                        <span className="font-normal leading-5 text-slate-400">Use each displayed clause heading exactly. Give the approved fact after every colon, including “not applicable” when accurate. Eligibility must identify the exact mappings; Dates must match the recorded window.</span>
                      </label>
                      {canMutate ? <button type="submit" className="min-h-11 justify-self-start rounded-lg bg-sky-600 px-5 text-sm font-bold text-white">Save facts and disable for re-approval</button> : null}
                    </form>
                  </section>

                  <section className="rounded-xl border border-white/10 bg-slate-950 p-4">
                    <h4 className="font-bold text-white">Exact eligibility mappings</h4>
                    <p className="mt-2 text-xs leading-5 text-slate-400">Products and services establish public eligibility. Brand selection is supporting context only and never activates every model in that brand.</p>
                    <form action={updateOfferMappingsAction} className="mt-4 grid gap-5">
                      <input type="hidden" name="offerId" value={offer.id} />
                      <fieldset disabled={!canMutate} className="grid gap-2">
                        <legend className="text-xs font-bold text-slate-200">Products</legend>
                        <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-slate-900 p-3">
                          {products.map((product) => (
                            <label key={product.id} className="flex min-h-10 items-center gap-2 text-xs text-slate-200">
                              <input type="checkbox" name="productIds" value={product.id} defaultChecked={selectedProductIds.has(product.id)} />
                              <span>{product.brand.name} · {product.modelName} <span className="text-slate-500">({product.status})</span></span>
                            </label>
                          ))}
                          {products.length === 0 ? <p className="text-xs text-slate-500">No database products.</p> : null}
                        </div>
                      </fieldset>
                      <fieldset disabled={!canMutate} className="grid gap-2">
                        <legend className="text-xs font-bold text-slate-200">Services</legend>
                        <div className="max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-slate-900 p-3">
                          {services.map((service) => (
                            <label key={service.id} className="flex min-h-10 items-center gap-2 text-xs text-slate-200">
                              <input type="checkbox" name="serviceIds" value={service.id} defaultChecked={selectedServiceIds.has(service.id)} />
                              <span>{service.name} <span className="text-slate-500">({service.status})</span></span>
                            </label>
                          ))}
                          {services.length === 0 ? <p className="text-xs text-slate-500">No database services.</p> : null}
                        </div>
                      </fieldset>
                      <fieldset disabled={!canMutate} className="grid gap-2">
                        <legend className="text-xs font-bold text-slate-200">Supporting brand context (optional)</legend>
                        <div className="grid gap-1 rounded-lg border border-white/10 bg-slate-900 p-3 sm:grid-cols-2">
                          {brands.map((brand) => (
                            <label key={brand.id} className="flex min-h-10 items-center gap-2 text-xs text-slate-200">
                              <input type="checkbox" name="brandIds" value={brand.id} defaultChecked={selectedBrandIds.has(brand.id)} />
                              <span>{brand.name} <span className="text-slate-500">({brand.isPublished ? "published" : "draft"})</span></span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      {canMutate ? <button type="submit" className="min-h-11 justify-self-start rounded-lg bg-sky-600 px-5 text-sm font-bold text-white">Save mappings and disable for re-approval</button> : null}
                    </form>
                  </section>
                </div>

                {canMutate ? (
                  <section className="rounded-xl border border-amber-300/25 bg-amber-300/5 p-4">
                    <h4 className="font-bold text-amber-100">Owner publication decision</h4>
                    {offer.enabled ? (
                      <form action={setOfferEnabledAction} className="mt-3">
                        <input type="hidden" name="offerId" value={offer.id} />
                        <input type="hidden" name="intent" value="disable" />
                        <button type="submit" className="min-h-11 rounded-lg border border-rose-300/40 px-5 text-sm font-bold text-rose-100">Disable immediately</button>
                      </form>
                    ) : (
                      <form action={setOfferEnabledAction} className="mt-3 grid gap-3">
                        <input type="hidden" name="offerId" value={offer.id} />
                        <input type="hidden" name="intent" value="enable" />
                        <label className="flex items-start gap-2 text-xs leading-5 text-amber-100">
                          <input className="mt-1" type="checkbox" name="confirmation" value="offer_approved" required />
                        I reviewed the exact mapped eligibility, dates, pricing, deposit, warranty, trial applicability, all written commercial terms and the publication checklist. I approve this program without implying stock, suitability, availability or a discount. Only the 50% campaign may communicate its exact approved maximum saving.
                        </label>
                        <button disabled={!gate.ready} type="submit" className="min-h-11 justify-self-start rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Record Owner approval and enable</button>
                      </form>
                    )}
                  </section>
                ) : null}
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
