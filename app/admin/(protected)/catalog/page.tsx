import {
  AdminRole,
  MediaRightsStatus,
  Prisma,
  ProductStatus,
} from "@prisma/client";
import { requireAdmin } from "@/lib/admin/auth";
import {
  evaluateBrandPublicationGate,
  evaluateProductMediaGate,
  evaluateProductPublicationGate,
  isDraftReferenceProductMediaKey,
  minimumPublishedProductsPerBrand,
  primaryCatalogBrandSlugs,
  type CatalogGateResult,
} from "@/lib/admin/catalog-gates";
import { getPrisma } from "@/lib/db";
import {
  confirmBrandSourceAction,
  confirmProductSourceAction,
  recordProductMediaRightsAction,
  revokeBrandSourceAction,
  revokeProductSourceAction,
  selectPrimaryProductMediaAction,
  setBrandPublicationAction,
  setProductPublicationAction,
} from "./actions";
import {
  CreateBrandDraftForm,
  CreateProductDraftForm,
  EditBrandDraftForm,
  ProductDraftFacts,
  ProductLifecycleForm,
} from "./catalog-draft-forms";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type CatalogProduct = Prisma.HearingAidGetPayload<{ include: { media: true } }>;
type CatalogBrand = Prisma.BrandGetPayload<{
  include: { hearingAids: { include: { media: true } } };
}>;

const notices: Record<string, { tone: "success" | "error"; message: string }> = {
  brand_draft_created: { tone: "success", message: "An unapproved, unpublished brand draft was created." },
  brand_details_updated: { tone: "success", message: "Brand facts were saved; prior source approval and database publication were revoked." },
  product_draft_created: { tone: "success", message: "An unapproved model draft was created with unknown feature states." },
  product_details_updated: { tone: "success", message: "Model facts were saved, source approval was revoked, and publication gates were rechecked." },
  product_lifecycle_updated: { tone: "success", message: "The recoverable model lifecycle state was updated." },
  brand_source_confirmed: { tone: "success", message: "The Owner confirmed the exact brand source." },
  brand_source_revoked: { tone: "success", message: "Brand source approval was revoked and dependent publication was rechecked." },
  product_source_confirmed: { tone: "success", message: "The Owner confirmed the exact model source." },
  product_source_revoked: { tone: "success", message: "Model source approval was revoked and dependent publication was rechecked." },
  media_rights_recorded: { tone: "success", message: "The media-rights review was recorded and publication gates were rechecked." },
  media_uploaded_unverified: {
    tone: "success",
    message: "The optimized image was stored as UNVERIFIED and non-primary. Dependent publication gates were rechecked; review its rights separately before selecting it.",
  },
  primary_media_selected: { tone: "success", message: "The eligible rights-cleared image is now the sole primary image." },
  product_publication_updated: { tone: "success", message: "The model publication state was updated." },
  brand_publication_updated: { tone: "success", message: "The brand publication state was updated." },
  owner_required: { tone: "error", message: "Only an active Owner can change catalog approval records." },
  brand_not_found: { tone: "error", message: "That brand no longer exists." },
  product_not_found: { tone: "error", message: "That model no longer exists." },
  media_not_found: { tone: "error", message: "That media record no longer exists." },
  media_upload_origin_rejected: { tone: "error", message: "The media upload was rejected because it was not a same-origin admin submission." },
  media_upload_invalid: { tone: "error", message: "Choose one valid JPEG, PNG, or WebP image and complete the required media fields." },
  media_upload_too_large: { tone: "error", message: "The selected image or multipart request exceeds the 8 MB file limit." },
  media_upload_unsupported: { tone: "error", message: "The image MIME declaration, magic bytes, or decoded format is not an allowed JPEG, PNG, or WebP." },
  media_upload_unavailable: { tone: "error", message: "The public product-media intake is not configured or is temporarily unavailable." },
  media_upload_cleanup_failed: { tone: "error", message: "The media record was not saved and Blob cleanup needs operator attention before retrying." },
  media_upload_failed: { tone: "error", message: "The image could not be stored safely. No media approval was granted." },
  invalid_input: { tone: "error", message: "Check required fields, controlled values, object JSON, exact HTTPS sources, and Owner confirmation." },
  no_change: { tone: "error", message: "The requested value is already active; no audit mutation was written." },
  invalid_transition: { tone: "error", message: "Archived models cannot be published from this approval screen." },
  gate_incomplete: { tone: "error", message: "Publication is blocked until every displayed source and media gate passes." },
  draft_reference_media: {
    tone: "error",
    message: "Imported draft-reference media must remain unverified and can never be primary or publishable.",
  },
  inventory_claim: { tone: "error", message: "Stock, inventory, current-availability, and fulfilment claims are not allowed in catalog facts." },
  duplicate_slug: { tone: "error", message: "That stable slug or unique display name is already in use." },
  change_failed: { tone: "error", message: "The catalog change could not be completed safely." },
};

const approvedRightsOptions = [
  MediaRightsStatus.MANUFACTURER_AUTHORIZED,
  MediaRightsStatus.LICENSED,
  MediaRightsStatus.OWNED,
  MediaRightsStatus.PUBLIC_DOMAIN,
] as const;

function noticeValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.slice(0, 80) : "";
}

function formatDate(value: Date | null): string {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function GateChecklist({ gate }: { gate: CatalogGateResult }) {
  return (
    <ul className="mt-3 grid gap-2 text-xs">
      {gate.checks.map((check) => (
        <li
          key={check.key}
          className={`flex items-start gap-2 ${check.passed ? "text-emerald-200" : "text-amber-200"}`}
        >
          <span aria-hidden="true" className="mt-0.5 font-black">
            {check.passed ? "✓" : "×"}
          </span>
          <span>{check.label}</span>
          <span className="sr-only">: {check.passed ? "passed" : "not passed"}</span>
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({ ready, children }: { ready: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
        ready ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200"
      }`}
    >
      {children}
    </span>
  );
}

function ProductMediaCard({
  media,
  canMutate,
}: {
  media: CatalogProduct["media"][number];
  canMutate: boolean;
}) {
  const gate = evaluateProductMediaGate(media);
  const isDraftReference = isDraftReferenceProductMediaKey(media.storageKey);
  const rightsSelectOptions = [
    MediaRightsStatus.UNVERIFIED,
    ...approvedRightsOptions,
    MediaRightsStatus.REJECTED,
  ];

  return (
    <article className="rounded-xl border border-white/10 bg-slate-950 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all font-mono text-xs text-slate-300">{media.storageKey}</p>
          <p className="mt-1 text-xs text-slate-500">
            {media.contentType} · {media.width ?? "?"} × {media.height ?? "?"} · {media.altText || "No alt text"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {media.isPrimary ? <StatusBadge ready={gate.ready}>Primary</StatusBadge> : null}
          <StatusBadge ready={gate.ready}>{gate.ready ? "Media gate passed" : "Media blocked"}</StatusBadge>
        </div>
      </div>

      {isDraftReference ? (
        <div role="alert" className="mt-3 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-xs leading-5 text-rose-100">
          Imported local reference: this record must remain UNVERIFIED. It cannot receive rights
          approval, become primary, or support publication. A separately uploaded and optimized
          public Blob record is required.
        </div>
      ) : null}

      <GateChecklist gate={gate} />

      <dl className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
        <div><dt className="font-bold text-slate-300">Asset source</dt><dd className="mt-1 break-all">{media.sourceUrl || "Not recorded"}</dd></div>
        <div><dt className="font-bold text-slate-300">Rights evidence</dt><dd className="mt-1 break-all">{media.rightsEvidenceUrl || "Not recorded"}</dd></div>
        <div><dt className="font-bold text-slate-300">Rights state</dt><dd className="mt-1">{media.rightsStatus.replaceAll("_", " ")}</dd></div>
        <div><dt className="font-bold text-slate-300">Approval</dt><dd className="mt-1">{formatDate(media.rightsApprovedAt)}{media.rightsApprovedBy ? ` · ${media.rightsApprovedBy}` : ""}</dd></div>
      </dl>

      {canMutate && !isDraftReference ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <form action={recordProductMediaRightsAction} className="grid gap-3 rounded-xl border border-white/10 bg-slate-900 p-4 sm:grid-cols-2">
            <input type="hidden" name="mediaId" value={media.id} />
            <label className="grid gap-1 text-xs font-bold text-slate-200">
              Rights decision
              <select name="rightsStatus" defaultValue={media.rightsStatus} className="min-h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-white">
                {rightsSelectOptions.map((status) => (
                  <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-bold text-slate-200">
              Exact HTTPS asset source
              <input name="sourceUrl" type="url" maxLength={500} defaultValue={media.sourceUrl || ""} placeholder="https://manufacturer.example/asset" className="min-h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-white" />
            </label>
            <label className="grid gap-1 text-xs font-bold text-slate-200">
              HTTPS rights-evidence location
              <input name="rightsEvidenceUrl" type="url" maxLength={1000} defaultValue={media.rightsEvidenceUrl || ""} placeholder="https://evidence.example/record" className="min-h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-white" />
            </label>
            <label className="grid gap-1 text-xs font-bold text-slate-200">
              Review notes
              <input name="rightsNotes" maxLength={1000} defaultValue={media.rightsNotes || ""} placeholder="Scope, license, or rejection reason" className="min-h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-white" />
            </label>
            <label className="flex min-h-10 items-start gap-2 text-xs leading-5 text-amber-100 sm:col-span-2">
              <input className="mt-1" type="checkbox" name="confirmation" value="rights_reviewed" required />
              I checked this exact asset, source, commercial-use status, and evidence. I am not inferring permission.
            </label>
            <button type="submit" className="min-h-10 rounded-lg bg-sky-600 px-4 text-xs font-bold text-white sm:col-span-2 sm:justify-self-start">
              Record Owner rights review
            </button>
          </form>
          {!media.isPrimary ? (
            <form action={selectPrimaryProductMediaAction}>
              <input type="hidden" name="mediaId" value={media.id} />
              <button
                type="submit"
                disabled={!gate.ready}
                className="min-h-10 rounded-lg border border-emerald-400/40 px-4 text-xs font-bold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Select as sole primary
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function ProductCard({ product, canMutate }: { product: CatalogProduct; canMutate: boolean }) {
  const gate = evaluateProductPublicationGate(product);
  const isPublished = product.status === ProductStatus.PUBLISHED;
  const canChangePublication = product.status !== ProductStatus.ARCHIVED;

  return (
    <details className="rounded-xl border border-white/10 bg-slate-900">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 marker:hidden">
        <div>
          <h3 className="font-bold text-white">{product.modelName}</h3>
          <p className="mt-1 text-xs text-slate-500">/{product.slug} · {product.media.length} media record{product.media.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-200">{product.status}</span>
          <StatusBadge ready={gate.ready}>{gate.ready ? "Publishable" : "Gate incomplete"}</StatusBadge>
        </div>
      </summary>

      <div className="border-t border-white/10 p-4">
        <div className="mb-5 grid gap-4">
          <ProductDraftFacts product={product} canMutate={canMutate} />
          {canMutate ? <ProductLifecycleForm product={product} /> : null}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-slate-950 p-4">
            <h4 className="font-bold text-white">Model source verification</h4>
            <p className="mt-2 break-all text-xs text-slate-400">{product.sourceUrl || "No exact source URL recorded"}</p>
            <p className="mt-1 text-xs text-slate-500">{formatDate(product.verifiedAt)}{product.verifiedBy ? ` · ${product.verifiedBy}` : ""}</p>
            <GateChecklist gate={gate} />
          </section>

          {canMutate ? (
            <section className="grid gap-3 rounded-xl border border-white/10 bg-slate-950 p-4">
              <form action={confirmProductSourceAction} className="grid gap-3">
                <input type="hidden" name="productId" value={product.id} />
                <label className="grid gap-1 text-xs font-bold text-slate-200">
                  Exact HTTPS manufacturer/model source
                  <input name="sourceUrl" type="url" required maxLength={500} defaultValue={product.sourceUrl || ""} className="min-h-10 rounded-lg border border-white/10 bg-slate-900 px-3 text-white" />
                </label>
                <label className="flex min-h-10 items-start gap-2 text-xs leading-5 text-amber-100">
                  <input className="mt-1" type="checkbox" name="confirmation" value="source_confirmed" required />
                  I reviewed this exact manufacturer/model page and confirm the stored model data against it.
                </label>
                <button type="submit" className="min-h-10 rounded-lg bg-sky-600 px-4 text-xs font-bold text-white sm:justify-self-start">Confirm model source</button>
              </form>
              {product.verifiedAt || product.verifiedBy ? (
                <form action={revokeProductSourceAction}>
                  <input type="hidden" name="productId" value={product.id} />
                  <button type="submit" className="min-h-10 rounded-lg border border-rose-400/40 px-4 text-xs font-bold text-rose-200">Revoke model-source approval</button>
                </form>
              ) : null}
              {canChangePublication ? (
                <form action={setProductPublicationAction} className="rounded-lg border border-white/10 p-3">
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="intent" value={isPublished ? "unpublish" : "publish"} />
                  {!isPublished ? (
                    <label className="mb-3 flex items-start gap-2 text-xs leading-5 text-amber-100">
                      <input className="mt-1" type="checkbox" name="confirmation" value="publication_confirmed" required />
                      Publish only this source-verified model with its sole rights-cleared primary image.
                    </label>
                  ) : null}
                  <button
                    type="submit"
                    disabled={!isPublished && !gate.ready}
                    className="min-h-10 rounded-lg border border-emerald-400/40 px-4 text-xs font-bold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isPublished ? "Return model to draft" : "Publish approved model"}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-amber-200">Archived models require a separate lifecycle decision before publication.</p>
              )}
            </section>
          ) : (
            <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-sm text-sky-100">
              Admin read-only view. An active Owner must confirm sources, approve media rights, and change publication states.
            </div>
          )}
        </div>

        <section className="mt-5">
          <h4 className="font-bold text-white">Product media</h4>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Only a non-private optimized WebP/AVIF Blob key with dimensions, exact source, approved
            commercial rights, evidence, dates, and Owner identity can become primary.
          </p>
          {canMutate ? (
            <form
              action="/api/admin/catalog/media"
              method="post"
              encType="multipart/form-data"
              className="mt-4 grid gap-3 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 sm:grid-cols-2"
            >
              <input type="hidden" name="hearingAidId" value={product.id} />
              <div className="sm:col-span-2">
                <h5 className="font-bold text-sky-100">Upload a rights-pending product image</h5>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  One JPEG, PNG, or WebP up to 8 MB. The server decodes, rotates, bounds, strips
                  metadata, and re-encodes it as WebP. The new record remains UNVERIFIED,
                  non-primary, and blocked from publication.
                </p>
              </div>
              <label className="grid gap-1 text-xs font-bold text-slate-200 sm:col-span-2">
                Source image
                <input
                  name="file"
                  type="file"
                  required
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  className="min-h-10 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white file:mr-3 file:rounded-md file:border-0 file:bg-sky-600 file:px-3 file:py-1 file:font-bold file:text-white"
                />
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-200">
                Accurate alternative text
                <input
                  name="altText"
                  required
                  minLength={1}
                  maxLength={240}
                  placeholder={`${product.modelName} hearing aid`}
                  className="min-h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-white"
                />
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-200">
                Exact HTTPS asset source
                <input
                  name="sourceUrl"
                  type="url"
                  required
                  maxLength={500}
                  placeholder="https://manufacturer.example/exact-asset"
                  className="min-h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-white"
                />
              </label>
              <label className="flex min-h-10 items-start gap-2 text-xs leading-5 text-amber-100 sm:col-span-2">
                <input
                  className="mt-1"
                  type="checkbox"
                  name="confirmation"
                  value="unverified_media_intake"
                  required
                />
                I understand that upload records provenance only. It does not approve commercial
                rights, make this image primary, or publish this model.
              </label>
              <button
                type="submit"
                className="min-h-10 rounded-lg bg-sky-600 px-4 text-xs font-bold text-white sm:col-span-2 sm:justify-self-start"
              >
                Upload as UNVERIFIED media
              </button>
            </form>
          ) : null}
          <div className="mt-3 grid gap-3">
            {product.media.map((media) => (
              <ProductMediaCard key={media.id} media={media} canMutate={canMutate} />
            ))}
            {!product.media.length ? (
              <p className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-100">No media records exist; publication remains blocked.</p>
            ) : null}
          </div>
        </section>
      </div>
    </details>
  );
}

function gatePassingPublishedCount(brand: CatalogBrand): number {
  return brand.hearingAids.filter(
    (product) =>
      product.status === ProductStatus.PUBLISHED &&
      evaluateProductPublicationGate(product).ready,
  ).length;
}

function BrandCard({ brand, canMutate }: { brand: CatalogBrand; canMutate: boolean }) {
  const approvedProductCount = gatePassingPublishedCount(brand);
  const gate = evaluateBrandPublicationGate(brand, approvedProductCount);

  return (
    <details className="rounded-2xl border border-white/10 bg-slate-900">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 p-5 marker:hidden">
        <div>
          <h2 className="text-xl font-bold text-white">{brand.name}</h2>
          <p className="mt-1 text-xs text-slate-500">/{brand.slug} · {brand.hearingAids.length} database model{brand.hearingAids.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge ready={approvedProductCount >= minimumPublishedProductsPerBrand}>
            {approvedProductCount}/{minimumPublishedProductsPerBrand} approved published models
          </StatusBadge>
          <StatusBadge ready={brand.isPublished}>{brand.isPublished ? "Brand published in DB" : "Brand hidden in DB"}</StatusBadge>
        </div>
      </summary>

      <div className="border-t border-white/10 p-5">
        <section className="mb-5 rounded-xl border border-white/10 bg-slate-950 p-4">
          <h3 className="font-bold text-white">Stored brand facts</h3>
          <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-[auto_minmax(0,1fr)]">
            <dt className="font-bold text-slate-400">Stable slug</dt>
            <dd className="font-mono text-slate-200">{brand.slug}</dd>
            <dt className="font-bold text-slate-400">Sort order</dt>
            <dd className="text-slate-200">{brand.sortOrder}</dd>
            <dt className="font-bold text-slate-400">Description</dt>
            <dd className="whitespace-pre-wrap text-slate-200">{brand.description || "Not recorded"}</dd>
          </dl>
        </section>
        {canMutate ? (
          <div className="mb-5">
            <EditBrandDraftForm brand={brand} />
          </div>
        ) : null}
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-slate-950 p-4">
            <h3 className="font-bold text-white">Brand publication gate</h3>
            <p className="mt-2 break-all text-xs text-slate-400">{brand.sourceUrl || "No exact source URL recorded"}</p>
            <p className="mt-1 text-xs text-slate-500">{formatDate(brand.verifiedAt)}{brand.verifiedBy ? ` · ${brand.verifiedBy}` : ""}</p>
            <GateChecklist gate={gate} />
          </section>

          {canMutate ? (
            <section className="grid gap-3 rounded-xl border border-white/10 bg-slate-950 p-4">
              <form action={confirmBrandSourceAction} className="grid gap-3">
                <input type="hidden" name="brandId" value={brand.id} />
                <label className="grid gap-1 text-xs font-bold text-slate-200">
                  Exact HTTPS manufacturer/brand source
                  <input name="sourceUrl" type="url" required maxLength={500} defaultValue={brand.sourceUrl || ""} className="min-h-10 rounded-lg border border-white/10 bg-slate-900 px-3 text-white" />
                </label>
                <label className="flex min-h-10 items-start gap-2 text-xs leading-5 text-amber-100">
                  <input className="mt-1" type="checkbox" name="confirmation" value="source_confirmed" required />
                  I reviewed this exact manufacturer page and confirm this brand record against it.
                </label>
                <button type="submit" className="min-h-10 rounded-lg bg-sky-600 px-4 text-xs font-bold text-white sm:justify-self-start">Confirm brand source</button>
              </form>
              {brand.verifiedAt || brand.verifiedBy ? (
                <form action={revokeBrandSourceAction}>
                  <input type="hidden" name="brandId" value={brand.id} />
                  <button type="submit" className="min-h-10 rounded-lg border border-rose-400/40 px-4 text-xs font-bold text-rose-200">Revoke brand-source approval</button>
                </form>
              ) : null}
              <form action={setBrandPublicationAction} className="rounded-lg border border-white/10 p-3">
                <input type="hidden" name="brandId" value={brand.id} />
                <input type="hidden" name="intent" value={brand.isPublished ? "unpublish" : "publish"} />
                {!brand.isPublished ? (
                  <label className="mb-3 flex items-start gap-2 text-xs leading-5 text-amber-100">
                    <input className="mt-1" type="checkbox" name="confirmation" value="publication_confirmed" required />
                    Publish this source-confirmed brand only after at least four gate-passing models are published.
                  </label>
                ) : null}
                <button
                  type="submit"
                  disabled={!brand.isPublished && !gate.ready}
                  className="min-h-10 rounded-lg border border-emerald-400/40 px-4 text-xs font-bold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {brand.isPublished ? "Unpublish brand" : "Publish approved brand in DB"}
                </button>
              </form>
            </section>
          ) : (
            <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-sm text-sky-100">
              Admin read-only view. Only an active Owner can confirm or revoke source approval and publication.
            </div>
          )}
        </div>

        <section className="mt-5">
          <h3 className="font-bold text-white">Models</h3>
          {canMutate ? (
            <div className="mt-3">
              <CreateProductDraftForm brand={brand} />
            </div>
          ) : null}
          <div className="mt-3 grid gap-3">
            {brand.hearingAids.map((product) => (
              <ProductCard key={product.id} product={product} canMutate={canMutate} />
            ))}
            {!brand.hearingAids.length ? <p className="text-sm text-slate-400">No database models exist for this brand.</p> : null}
          </div>
        </section>
      </div>
    </details>
  );
}

export default async function AdminCatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdmin([AdminRole.OWNER, AdminRole.ADMIN]);
  const params = await searchParams;
  const notice = notices[noticeValue(params.notice)];
  const brands = await getPrisma().brand.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      hearingAids: {
        orderBy: [{ sortOrder: "asc" }, { modelName: "asc" }],
        include: { media: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
      },
    },
  });
  const primaryReadiness = primaryCatalogBrandSlugs.map((slug) => {
    const brand = brands.find((candidate) => candidate.slug === slug);
    const approvedProducts = brand ? gatePassingPublishedCount(brand) : 0;
    const gate = brand ? evaluateBrandPublicationGate(brand, approvedProducts) : null;
    return {
      slug,
      brand,
      approvedProducts,
      ready: Boolean(brand?.isPublished && gate?.ready),
      sourceReady: Boolean(gate?.checks.slice(0, 3).every((check) => check.passed)),
    };
  });
  const databaseLaunchReady = primaryReadiness.every((entry) => entry.ready);
  const canMutate = admin.role === AdminRole.OWNER;

  return (
    <section className="space-y-6">
      <header className="max-w-4xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sky-300">Controlled publication</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Catalog approvals</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          Owners explicitly confirm manufacturer sources, commercial media rights, evidence, and
          primary images before publishing database records. Admins can inspect every gate but
          cannot mutate it. No approval on this screen enables the staged public catalog.
        </p>
      </header>

      {notice ? (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={`rounded-2xl border p-4 text-sm ${
            notice.tone === "error"
              ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
              : "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <div role="note" className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100">
        <strong>Launch remains default-off.</strong> This is a database-readiness and audit workflow
        only. It does not change the public catalog staging flag, sitemap, routes, or repository.
      </div>

      {canMutate ? <CreateBrandDraftForm /> : null}

      <section aria-labelledby="primary-readiness-heading" className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="primary-readiness-heading" className="text-xl font-bold text-white">Four-primary-brand readiness</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Every primary brand needs its own Owner-confirmed source, at least four individually
              gate-passing published models, and an explicit brand publication decision.
            </p>
          </div>
          <StatusBadge ready={databaseLaunchReady}>
            {databaseLaunchReady ? "Database approval set ready" : "Database approval set incomplete"}
          </StatusBadge>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {primaryReadiness.map((entry) => (
            <article key={entry.slug} className="rounded-xl border border-white/10 bg-slate-950 p-4">
              <h3 className="font-bold capitalize text-white">{entry.brand?.name || entry.slug}</h3>
              <dl className="mt-3 grid gap-2 text-xs">
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Database brand</dt><dd className={entry.brand ? "text-emerald-200" : "text-amber-200"}>{entry.brand ? "Present" : "Missing"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Source approval</dt><dd className={entry.sourceReady ? "text-emerald-200" : "text-amber-200"}>{entry.sourceReady ? "Complete" : "Incomplete"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Approved models</dt><dd className={entry.approvedProducts >= minimumPublishedProductsPerBrand ? "text-emerald-200" : "text-amber-200"}>{entry.approvedProducts}/{minimumPublishedProductsPerBrand}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Brand state</dt><dd className={entry.brand?.isPublished ? "text-emerald-200" : "text-amber-200"}>{entry.brand?.isPublished ? "Published in DB" : "Hidden in DB"}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      {!canMutate ? (
        <div role="status" className="rounded-2xl border border-sky-400/25 bg-sky-400/5 p-4 text-sm text-sky-100">
          You have Admin read access. Only an active Owner can write approval or publication changes.
        </div>
      ) : null}

      <div className="grid gap-4">
        {brands.map((brand) => (
          <BrandCard key={brand.id} brand={brand} canMutate={canMutate} />
        ))}
        {!brands.length ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5 text-sm text-amber-100">
            No database catalog records exist. Nothing is approved or publishable.
          </div>
        ) : null}
      </div>
    </section>
  );
}
