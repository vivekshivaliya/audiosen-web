import { ProductStatus, type Brand, type HearingAid, type Prisma } from "@prisma/client";
import {
  catalogDeviceStyles,
  catalogFeatureKeys,
  type CatalogDeviceStyle,
  type CatalogFeatureKey,
  type TriState,
} from "@/lib/catalog/types";
import {
  createCatalogBrandDraftAction,
  createCatalogProductDraftAction,
  setCatalogProductArchivedAction,
  updateCatalogBrandDraftAction,
  updateCatalogProductDraftAction,
} from "./actions";

const inputClass =
  "min-h-10 rounded-lg border border-white/10 bg-slate-950 px-3 text-sm text-white placeholder:text-slate-600";
const textareaClass =
  "min-h-24 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600";
const labelClass = "grid gap-1.5 text-xs font-bold text-slate-200";

const featureLabels: Record<CatalogFeatureKey, string> = {
  rechargeable: "Rechargeable format",
  bluetoothStreaming: "Bluetooth streaming",
  auracast: "Auracast support",
  appControl: "App control",
  crosSupport: "CROS support",
  pediatricPath: "Paediatric fitting path",
  powerFormat: "Power-format option",
  customFit: "Custom-fit option",
};

const triStateOptions: readonly { value: TriState; label: string }[] = [
  { value: "unknown", label: "Unknown / not source-confirmed" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

function booleanTriState(value: boolean | null): TriState {
  return value === true ? "yes" : value === false ? "no" : "unknown";
}

function featureState(features: Prisma.JsonValue | null, key: CatalogFeatureKey): TriState {
  if (!features || typeof features !== "object" || Array.isArray(features)) return "unknown";
  const candidate = (features as Prisma.JsonObject)[key];
  return candidate === "yes" || candidate === "no" || candidate === "unknown"
    ? candidate
    : "unknown";
}

function selectedStyle(value: string | null): CatalogDeviceStyle {
  return catalogDeviceStyles.includes(value as CatalogDeviceStyle)
    ? (value as CatalogDeviceStyle)
    : "various";
}

function formattedJson(value: Prisma.JsonValue | null): string {
  return value === null ? "" : JSON.stringify(value, null, 2);
}

function TriStateSelect({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: TriState;
}) {
  return (
    <select name={name} defaultValue={defaultValue} className={inputClass}>
      {triStateOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function CreateBrandDraftForm() {
  return (
    <details className="rounded-2xl border border-sky-400/25 bg-sky-400/5">
      <summary className="cursor-pointer list-none p-5 font-bold text-sky-100 marker:hidden">
        Create an unapproved brand draft
      </summary>
      <form action={createCatalogBrandDraftAction} className="grid gap-4 border-t border-sky-400/20 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2 rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
          Creation records facts only. It never verifies a source, publishes the brand, or changes
          the public catalog gate. The slug becomes the stable identifier and cannot be edited here.
        </div>
        <label className={labelClass}>
          Stable slug
          <input name="slug" required maxLength={100} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="manufacturer-name" className={inputClass} />
        </label>
        <label className={labelClass}>
          Display name
          <input name="name" required minLength={2} maxLength={120} placeholder="Manufacturer name" className={inputClass} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Description
          <textarea name="description" maxLength={4000} className={textareaClass} />
        </label>
        <label className={labelClass}>
          Sort order
          <input name="sortOrder" type="number" min={-10000} max={10000} defaultValue={0} required className={inputClass} />
        </label>
        <button type="submit" className="min-h-10 rounded-lg bg-sky-600 px-4 text-sm font-bold text-white sm:self-end">
          Create brand draft
        </button>
      </form>
    </details>
  );
}

export function EditBrandDraftForm({ brand }: { brand: Brand }) {
  return (
    <details className="rounded-xl border border-white/10 bg-slate-950">
      <summary className="cursor-pointer list-none p-4 text-sm font-bold text-white marker:hidden">
        Edit brand draft facts and ordering
      </summary>
      <form action={updateCatalogBrandDraftAction} className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-2">
        <input type="hidden" name="brandId" value={brand.id} />
        <p className="text-xs leading-5 text-amber-100 sm:col-span-2">
          Stable slug: <span className="font-mono">{brand.slug}</span>. Saving revokes source
          approval and unpublishes this database brand until an Owner verifies it again.
        </p>
        <label className={labelClass}>
          Display name
          <input name="name" required minLength={2} maxLength={120} defaultValue={brand.name} className={inputClass} />
        </label>
        <label className={labelClass}>
          Sort order
          <input name="sortOrder" type="number" min={-10000} max={10000} defaultValue={brand.sortOrder} required className={inputClass} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Description
          <textarea name="description" maxLength={4000} defaultValue={brand.description ?? ""} className={textareaClass} />
        </label>
        <label className="flex items-start gap-2 text-xs leading-5 text-amber-100 sm:col-span-2">
          <input className="mt-1" type="checkbox" name="confirmation" value="brand_facts_update_confirmed" required />
          I understand this factual edit revokes the prior source approval and database publication.
        </label>
        <button type="submit" className="min-h-10 rounded-lg bg-sky-600 px-4 text-sm font-bold text-white sm:col-span-2 sm:justify-self-start">
          Save brand draft facts
        </button>
      </form>
    </details>
  );
}

export function CreateProductDraftForm({ brand }: { brand: Brand }) {
  return (
    <details className="rounded-xl border border-sky-400/20 bg-sky-400/5">
      <summary className="cursor-pointer list-none p-4 text-sm font-bold text-sky-100 marker:hidden">
        Create an unapproved model draft
      </summary>
      <form action={createCatalogProductDraftAction} className="grid gap-3 border-t border-sky-400/20 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <input type="hidden" name="brandId" value={brand.id} />
        <p className="text-xs leading-5 text-amber-100 sm:col-span-2 xl:col-span-4">
          The model starts in DRAFT with unknown feature states, no source approval, no public media,
          and no publication. Its slug is stable after creation.
        </p>
        <label className={labelClass}>
          Stable model slug
          <input name="slug" required maxLength={140} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="model-family" className={inputClass} />
        </label>
        <label className={labelClass}>
          Model name
          <input name="modelName" required minLength={2} maxLength={180} placeholder="Model family" className={inputClass} />
        </label>
        <label className={labelClass}>
          Device style
          <select name="style" defaultValue="various" className={inputClass}>
            {catalogDeviceStyles.map((style) => <option key={style} value={style}>{style.toUpperCase()}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          Sort order
          <input name="sortOrder" type="number" min={-10000} max={10000} defaultValue={0} required className={inputClass} />
        </label>
        <button type="submit" className="min-h-10 rounded-lg bg-sky-600 px-4 text-sm font-bold text-white sm:col-span-2 sm:justify-self-start xl:col-span-4">
          Create model draft
        </button>
      </form>
    </details>
  );
}

function ReadOnlyFacts({ product }: { product: HearingAid }) {
  const facts = [
    ["Style", product.style],
    ["Summary", product.summary],
    ["Suitable use", product.suitableUse],
    ["Rechargeable", booleanTriState(product.rechargeable)],
    ["Bluetooth", booleanTriState(product.bluetooth)],
    ["Streaming", booleanTriState(product.streaming)],
    ["Mobile app", product.mobileApp],
    ["Hearing-loss suitability", product.hearingLossSuitability],
    ["Noise management", product.noiseManagement],
    ["Warranty", product.warranty],
    ["Fitting information", product.fittingInformation],
    ["After-care", product.afterCare],
    ["Repair support", product.repairSupport],
    ["Price note", product.priceNote],
    ["Consultation required", product.consultationRequired ? "Yes" : "No"],
    ["Featured", product.isFeatured ? "Yes" : "No"],
    ["Sort order", String(product.sortOrder)],
  ] as const;

  return (
    <section className="rounded-xl border border-white/10 bg-slate-950 p-4">
      <h4 className="font-bold text-white">Stored draft facts</h4>
      <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="font-bold text-slate-400">{label}</dt>
            <dd className="mt-1 whitespace-pre-wrap text-slate-200">{value || "Not recorded"}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h5 className="text-xs font-bold text-slate-400">Tri-state features</h5>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-xs text-slate-300">
            {JSON.stringify(Object.fromEntries(catalogFeatureKeys.map((key) => [key, featureState(product.features, key)])), null, 2)}
          </pre>
        </div>
        <div>
          <h5 className="text-xs font-bold text-slate-400">Specifications JSON</h5>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-xs text-slate-300">
            {formattedJson(product.specifications) || "Not recorded"}
          </pre>
        </div>
      </div>
    </section>
  );
}

export function ProductDraftFacts({
  product,
  canMutate,
}: {
  product: HearingAid;
  canMutate: boolean;
}) {
  if (!canMutate) return <ReadOnlyFacts product={product} />;

  return (
    <details className="rounded-xl border border-white/10 bg-slate-950">
      <summary className="cursor-pointer list-none p-4 text-sm font-bold text-white marker:hidden">
        Edit model draft facts, features, and ordering
      </summary>
      <form action={updateCatalogProductDraftAction} className="grid gap-4 border-t border-white/10 p-4 sm:grid-cols-2 xl:grid-cols-3">
        <input type="hidden" name="productId" value={product.id} />
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100 sm:col-span-2 xl:col-span-3">
          Stable slug: <span className="font-mono">{product.slug}</span>. Saving revokes model-source
          approval, returns every non-archived model to DRAFT, and rechecks the parent brand. Archived
          models remain archived. Do not enter stock, inventory, current availability, or dispatch claims.
        </div>
        <label className={labelClass}>
          Model name
          <input name="modelName" required minLength={2} maxLength={180} defaultValue={product.modelName} className={inputClass} />
        </label>
        <label className={labelClass}>
          Device style
          <select name="style" defaultValue={selectedStyle(product.style)} className={inputClass}>
            {catalogDeviceStyles.map((style) => <option key={style} value={style}>{style.toUpperCase()}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          Sort order
          <input name="sortOrder" type="number" min={-10000} max={10000} defaultValue={product.sortOrder} required className={inputClass} />
        </label>
        <label className={`${labelClass} sm:col-span-2 xl:col-span-3`}>
          Summary
          <textarea name="summary" maxLength={6000} defaultValue={product.summary ?? ""} className={textareaClass} />
        </label>
        <label className={`${labelClass} sm:col-span-2 xl:col-span-3`}>
          Suitable use
          <textarea name="suitableUse" maxLength={6000} defaultValue={product.suitableUse ?? ""} className={textareaClass} />
        </label>
        <label className={labelClass}>
          Rechargeable
          <TriStateSelect name="rechargeable" defaultValue={booleanTriState(product.rechargeable)} />
        </label>
        <label className={labelClass}>
          Bluetooth
          <TriStateSelect name="bluetooth" defaultValue={booleanTriState(product.bluetooth)} />
        </label>
        <label className={labelClass}>
          Streaming
          <TriStateSelect name="streaming" defaultValue={booleanTriState(product.streaming)} />
        </label>
        <label className={labelClass}>
          Mobile app
          <input name="mobileApp" maxLength={160} defaultValue={product.mobileApp ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          Hearing-loss suitability
          <input name="hearingLossSuitability" maxLength={240} defaultValue={product.hearingLossSuitability ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          Noise management
          <input name="noiseManagement" maxLength={500} defaultValue={product.noiseManagement ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          Warranty
          <input name="warranty" maxLength={500} defaultValue={product.warranty ?? ""} className={inputClass} />
        </label>
        <label className={labelClass}>
          Non-transactional price note
          <input name="priceNote" maxLength={240} defaultValue={product.priceNote ?? ""} placeholder="Assessment and fitting determine the quote" className={inputClass} />
        </label>
        <div className="grid content-start gap-3 rounded-xl border border-white/10 bg-slate-900 p-3">
          <label className="flex items-start gap-2 text-xs leading-5 text-slate-200">
            <input className="mt-1" type="checkbox" name="consultationRequired" value="true" defaultChecked={product.consultationRequired} />
            Consultation is required
          </label>
          <label className="flex items-start gap-2 text-xs leading-5 text-slate-200">
            <input className="mt-1" type="checkbox" name="isFeatured" value="true" defaultChecked={product.isFeatured} />
            Featured ordering flag (not an approval or availability claim)
          </label>
        </div>
        <label className={`${labelClass} sm:col-span-2 xl:col-span-3`}>
          Fitting information
          <textarea name="fittingInformation" maxLength={6000} defaultValue={product.fittingInformation ?? ""} className={textareaClass} />
        </label>
        <label className={`${labelClass} sm:col-span-2 xl:col-span-3`}>
          After-care
          <textarea name="afterCare" maxLength={6000} defaultValue={product.afterCare ?? ""} className={textareaClass} />
        </label>
        <label className={`${labelClass} sm:col-span-2 xl:col-span-3`}>
          Repair support
          <textarea name="repairSupport" maxLength={6000} defaultValue={product.repairSupport ?? ""} className={textareaClass} />
        </label>

        <fieldset className="grid gap-3 rounded-xl border border-white/10 bg-slate-900 p-4 sm:col-span-2 sm:grid-cols-2 xl:col-span-3 xl:grid-cols-4">
          <legend className="px-2 text-sm font-bold text-white">Structured feature evidence</legend>
          <p className="text-xs leading-5 text-slate-400 sm:col-span-2 xl:col-span-4">
            Keep Unknown until the exact manufacturer source confirms Yes or No.
          </p>
          {catalogFeatureKeys.map((key) => (
            <label key={key} className={labelClass}>
              {featureLabels[key]}
              <TriStateSelect name={`feature_${key}`} defaultValue={featureState(product.features, key)} />
            </label>
          ))}
        </fieldset>

        <label className={`${labelClass} sm:col-span-2 xl:col-span-3`}>
          Specifications JSON object
          <textarea
            name="specificationsJson"
            maxLength={30000}
            spellCheck={false}
            defaultValue={formattedJson(product.specifications)}
            placeholder={'{\n  "ipRating": "IP68",\n  "battery": { "chemistry": "lithium-ion" }\n}'}
            className={`${textareaClass} min-h-52 font-mono`}
          />
          <span className="font-normal leading-5 text-slate-500">
            Object only. Stock, inventory, availability, and fulfilment keys or promises are rejected.
          </span>
        </label>
        <label className="flex items-start gap-2 text-xs leading-5 text-amber-100 sm:col-span-2 xl:col-span-3">
          <input className="mt-1" type="checkbox" name="confirmation" value="product_facts_update_confirmed" required />
          I understand this factual edit revokes prior source approval and may automatically unpublish the parent brand.
        </label>
        <button type="submit" className="min-h-10 rounded-lg bg-sky-600 px-4 text-sm font-bold text-white sm:col-span-2 sm:justify-self-start xl:col-span-3">
          Save model draft facts
        </button>
      </form>
    </details>
  );
}

export function ProductLifecycleForm({ product }: { product: HearingAid }) {
  const archived = product.status === ProductStatus.ARCHIVED;
  return (
    <form action={setCatalogProductArchivedAction} className="grid gap-3 rounded-xl border border-rose-400/20 bg-rose-400/5 p-4">
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="intent" value={archived ? "restore" : "archive"} />
      <h4 className="text-sm font-bold text-white">Recoverable lifecycle</h4>
      <p className="text-xs leading-5 text-slate-400">
        {archived
          ? "Restore this archived model to DRAFT. Restoration never publishes it."
          : "Archive this model without deleting its facts, media, provenance, or audit history."}
      </p>
      {!archived ? (
        <label className="flex items-start gap-2 text-xs leading-5 text-amber-100">
          <input className="mt-1" type="checkbox" name="confirmation" value="archive_confirmed" required />
          I understand that archiving removes this model from publication but remains recoverable.
        </label>
      ) : null}
      <button type="submit" className="min-h-10 rounded-lg border border-rose-400/40 px-4 text-xs font-bold text-rose-100 justify-self-start">
        {archived ? "Restore to draft" : "Archive model"}
      </button>
    </form>
  );
}
