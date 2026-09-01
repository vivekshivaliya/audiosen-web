import type {
  CatalogBrand,
  CatalogBrandSlug,
  CatalogDeviceStyle,
  CatalogFeatureKey,
  CatalogFeatureRecord,
  CatalogFilterState,
  CatalogModel,
  TriState,
} from "@/lib/catalog/types";
import { catalogBrandSlugs, catalogDeviceStyles } from "@/lib/catalog/types";

const legacySource = {
  kind: "legacy-audiosen-catalogue",
  label: "Existing Audiosen editorial catalogue snapshot",
} as const;

const guidancePublication = {
  status: "guidance-only",
  note: "Staged as an informational model guide and enquiry path only. This guidance does not confirm owner inventory approval, stock, price, warranty, offer eligibility, trial availability, or personal suitability.",
} as const;

const pendingVerification = {
  status: "legacy-editorial-record",
  note: "The model name and attributes were migrated from Audiosen's earlier catalogue. Current manufacturer-source verification is pending.",
} as const;

const pendingMediaRights = {
  rightsStatus: "pending",
  publicUseApproved: false,
  rightsNote: "The local asset is retained as a fallback reference but is not displayed until commercial usage rights are recorded.",
} as const;

const manufacturerCheckedAt = "2026-08-22";

function manufacturerChecked(
  label: string,
  url: string,
  directlySupportedClaims: string,
): Pick<CatalogModel, "source" | "verification"> {
  return {
    source: {
      kind: "manufacturer",
      label,
      url,
      checkedAt: manufacturerCheckedAt,
    },
    verification: {
      status: "manufacturer-source-checked",
      checkedAt: manufacturerCheckedAt,
      note: `Official manufacturer source directly supports ${directlySupportedClaims}. Other feature fields remain unknown; this check does not establish Audiosen stock, price, warranty, or availability.`,
    },
  };
}

const unknownFeatures: CatalogFeatureRecord = {
  rechargeable: "unknown",
  bluetoothStreaming: "unknown",
  auracast: "unknown",
  appControl: "unknown",
  crosSupport: "unknown",
  pediatricPath: "unknown",
  powerFormat: "unknown",
  customFit: "unknown",
};

function features(
  yes: readonly CatalogFeatureKey[] = [],
  no: readonly CatalogFeatureKey[] = [],
): CatalogFeatureRecord {
  const result = { ...unknownFeatures };

  yes.forEach((key) => {
    result[key] = "yes";
  });
  no.forEach((key) => {
    result[key] = "no";
  });

  return result;
}

type ModelSeed = Pick<
  CatalogModel,
  "brandSlug" | "slug" | "name" | "style" | "summary" | "features"
> & {
  image: string;
  imageAlt: string;
} &
  Partial<Pick<CatalogModel, "source" | "verification">>;

/** The four current model guides selected for the homepage once Owner-approved. */
export const featuredCatalogModelKeys = [
  "signia~pure-charge-go-ix",
  "widex~allure-ric-r-d",
  "resound~vivia",
  "phonak~audeo-infinio-ultra-sphere",
] as const;

const featuredCatalogModelKeySet = new Set<string>(featuredCatalogModelKeys);

function model(seed: ModelSeed): CatalogModel {
  return {
    key: `${seed.brandSlug}~${seed.slug}`,
    slug: seed.slug,
    brandSlug: seed.brandSlug,
    name: seed.name,
    style: seed.style,
    summary: seed.summary,
    isFeatured: featuredCatalogModelKeySet.has(`${seed.brandSlug}~${seed.slug}`),
    features: seed.features,
    publication: guidancePublication,
    verification: seed.verification ?? pendingVerification,
    source: seed.source ?? legacySource,
    media: {
      assetPath: seed.image,
      alt: seed.imageAlt,
      ...pendingMediaRights,
    },
  };
}

/**
 * Safe runtime fallback while no approved catalogue data source is connected.
 * Brand publication is guidance-only and does not imply a commercial relationship or inventory.
 */
export const fallbackCatalogBrands = [
  {
    slug: "phonak",
    name: "Phonak",
    summary:
      "Browse model guides associated with Phonak in Audiosen's existing editorial catalogue.",
    logoPath: "/brands/phonak.svg",
    publication: guidancePublication,
    source: legacySource,
    mediaRights: pendingMediaRights,
  },
  {
    slug: "signia",
    name: "Signia",
    summary:
      "Browse model guides associated with Signia in Audiosen's existing editorial catalogue.",
    logoPath: "/brands/signia.svg",
    publication: guidancePublication,
    source: legacySource,
    mediaRights: pendingMediaRights,
  },
  {
    slug: "widex",
    name: "Widex",
    summary:
      "Browse model guides associated with Widex in Audiosen's existing editorial catalogue.",
    logoPath: "/brands/widex.svg",
    publication: guidancePublication,
    source: legacySource,
    mediaRights: pendingMediaRights,
  },
  {
    slug: "resound",
    name: "ReSound",
    summary:
      "Browse model guides associated with ReSound in Audiosen's existing editorial catalogue.",
    logoPath: "/brands/resound.svg",
    publication: guidancePublication,
    source: legacySource,
    mediaRights: pendingMediaRights,
  },
  {
    slug: "oticon",
    name: "Oticon",
    summary: "Browse model guides associated with Oticon in Audiosen's existing editorial catalogue.",
    logoPath: "/brands/oticon.svg",
    publication: guidancePublication,
    source: legacySource,
    mediaRights: pendingMediaRights,
  },
  {
    slug: "starkey",
    name: "Starkey",
    summary: "Browse model guides associated with Starkey in Audiosen's existing editorial catalogue.",
    logoPath: "/brands/starkey.svg",
    publication: guidancePublication,
    source: legacySource,
    mediaRights: pendingMediaRights,
  },
] as const satisfies readonly CatalogBrand[];

export const catalogBrands = fallbackCatalogBrands;

/**
 * The 34 entries migrated from the site's prior hard-coded catalogue.
 * Images remain gated and commercial fields are intentionally absent.
 */
export const fallbackCatalogModels = [
  model({
    brandSlug: "phonak",
    slug: "audeo-infinio-ultra-sphere",
    name: "Audéo Infinio Ultra Sphere",
    style: "ric",
    summary:
      "A receiver-in-canal entry in the Audéo Infinio family, listed for a current-information discussion with Audiosen.",
    features: features(["rechargeable", "bluetoothStreaming"]),
    image: "/images/products/phonak/audeo-sphere-infinio.png",
    imageAlt: "Phonak Audéo Infinio Ultra Sphere hearing aid",
    ...manufacturerChecked(
      "Phonak — Infinio Ultra manufacturer source sheet",
      "https://www.phonak.com/content/dam/celum/phonak/master-assets/en/documents/hearing-instruments/infinio-us/ph-flyer-infinio-digital-take-along-8.5x11-en-us.pdf",
      "the model identity, rechargeable option, and universal Bluetooth connectivity",
    ),
  }),
  model({
    brandSlug: "phonak",
    slug: "audeo-infinio-ultra-r",
    name: "Audéo Infinio Ultra R",
    style: "ric",
    summary:
      "A rechargeable receiver-in-canal entry in the Audéo Infinio family, presented as an informational guide.",
    features: features([
      "rechargeable",
      "bluetoothStreaming",
      "appControl",
      "crosSupport",
    ]),
    image: "/images/products/phonak/audeo-infinio.png",
    imageAlt: "Phonak Audéo Infinio Ultra R hearing aid",
    ...manufacturerChecked(
      "Phonak — Audéo Infinio Ultra R",
      "https://www.phonak.com/en-us/hearing-devices/hearing-aids/audeo-infinio",
      "the model identity, rechargeable option, Bluetooth streaming, myPhonak app control, and compatibility with Phonak CROS",
    ),
  }),
  model({
    brandSlug: "phonak",
    slug: "virto-r-infinio",
    name: "Virto R Infinio",
    style: "ite",
    summary:
      "An in-ear model entry in the Virto Infinio family, available here for format and feature enquiries.",
    features: features(["rechargeable", "bluetoothStreaming", "appControl", "customFit"]),
    image: "/images/products/phonak/virto-infinio.png",
    imageAlt: "Phonak Virto R Infinio in-ear hearing aid",
    ...manufacturerChecked(
      "Phonak — Virto R Infinio",
      "https://www.phonak.com/en-us/hearing-devices/hearing-aids/virto-infinio",
      "the model identity, in-the-ear custom format, rechargeable option, Bluetooth connectivity, and myPhonak app pairing",
    ),
  }),
  model({
    brandSlug: "phonak",
    slug: "cros-infinio",
    name: "CROS Infinio",
    style: "cros",
    summary:
      "A CROS-system entry intended for discussion after an appropriate assessment of single-sided hearing needs.",
    features: features(["rechargeable", "bluetoothStreaming", "crosSupport"]),
    image: "/images/products/phonak/cros-infinio.png",
    imageAlt: "Phonak CROS Infinio hearing device",
    ...manufacturerChecked(
      "Phonak — CROS Infinio",
      "https://www.phonak.com/en-us/hearing-devices/hearing-aids/cros-infinio",
      "the model identity, rechargeable option, CROS pathway for single-sided hearing loss, and Bluetooth connectivity when paired with a compatible Audéo Infinio hearing aid",
    ),
  }),
  model({
    brandSlug: "phonak",
    slug: "naida-lumity",
    name: "Naída Lumity",
    style: "bte",
    summary:
      "A behind-the-ear model-family entry listed for conversations about power-format hearing aids.",
    features: features([
      "rechargeable",
      "bluetoothStreaming",
      "appControl",
      "powerFormat",
    ]),
    image: "/images/products/phonak/naida-lumity.png",
    imageAlt: "Phonak Naída Lumity behind-the-ear hearing aid",
    ...manufacturerChecked(
      "Phonak — Naída Lumity",
      "https://www.phonak.com/en-us/hearing-devices/hearing-aids/naida-l",
      "the model-family identity, behind-the-ear and power-format options, a rechargeable family option, Bluetooth streaming, and myPhonak app control",
    ),
  }),
  model({
    brandSlug: "phonak",
    slug: "sky-lumity",
    name: "Sky Lumity",
    style: "bte",
    summary:
      "A pediatric-focused behind-the-ear family entry. Children require an age-appropriate clinical pathway before any device discussion.",
    features: features([
      "rechargeable",
      "bluetoothStreaming",
      "appControl",
      "pediatricPath",
    ]),
    image: "/images/products/phonak/sky-lumity.png",
    imageAlt: "Phonak Sky Lumity pediatric hearing aid",
    ...manufacturerChecked(
      "Phonak — Sky Lumity",
      "https://www.phonak.com/en-us/hearing-devices/hearing-aids/sky-lumity",
      "the model-family identity, pediatric behind-the-ear pathway, a rechargeable family option, Bluetooth connectivity, and myPhonak Junior app control",
    ),
  }),
  model({
    brandSlug: "signia",
    slug: "pure-charge-go-bct-ix",
    name: "Pure Charge&Go BCT IX",
    style: "ric",
    summary:
      "A rechargeable receiver-in-canal model entry listed for current connectivity and format enquiries.",
    features: features([
      "rechargeable",
      "bluetoothStreaming",
      "appControl",
    ]),
    image: "/images/products/signia/pure-chargego-bct-ix.png",
    imageAlt: "Signia Pure Charge and Go BCT IX hearing aid",
    ...manufacturerChecked(
      "Signia — Pure Charge&Go BCT IX",
      "https://www.signia.net/en/hearing-aids/integrated-xperience/pure-charge-go-ix/",
      "the model identity, RIC format, rechargeable option, Bluetooth streaming, and Signia app control",
    ),
  }),
  model({
    brandSlug: "signia",
    slug: "pure-charge-go-ix",
    name: "Pure Charge&Go IX",
    style: "ric",
    summary:
      "A rechargeable receiver-in-canal model entry presented for a feature and fitting discussion.",
    features: features(["rechargeable", "bluetoothStreaming", "appControl"]),
    image: "/images/products/signia/pure-chargego-ix.png",
    imageAlt: "Signia Pure Charge and Go IX hearing aid",
    ...manufacturerChecked(
      "Signia — Pure Charge&Go IX",
      "https://www.signia.net/en/hearing-aids/integrated-xperience/pure-charge-go-ix/",
      "the model-family identity, RIC format, rechargeable option, Bluetooth streaming, and Signia app control",
    ),
  }),
  model({
    brandSlug: "signia",
    slug: "silk-charge-go-ix",
    name: "Silk Charge&Go IX",
    style: "cic",
    summary:
      "A rechargeable in-canal model entry for people wishing to ask about a more discreet physical format.",
    features: features(["rechargeable", "appControl"]),
    image: "/images/products/signia/silk-chargego-ix.png",
    imageAlt: "Signia Silk Charge and Go IX in-canal hearing aid",
    ...manufacturerChecked(
      "Signia — Silk Charge&Go IX",
      "https://www.signia.net/en-us/hearing-aids/integrated-xperience/silk-charge-go-ix/",
      "the model identity, instant-fit CIC format, rechargeable option, and Signia app control",
    ),
  }),
  model({
    brandSlug: "signia",
    slug: "active-pro-ix",
    name: "Active Pro IX",
    style: "earbud",
    summary:
      "An earbud-style hearing-aid entry listed for a current product-information enquiry.",
    features: features(["rechargeable", "bluetoothStreaming"]),
    image: "/images/products/signia/active-pro-ix.png",
    imageAlt: "Signia Active Pro IX earbud-style hearing aids",
    ...manufacturerChecked(
      "Signia — Active Pro IX",
      "https://www.signia.net/en/hearing-aids/integrated-xperience/active-ix/",
      "the model identity, earbud format, rechargeable option, and Bluetooth streaming",
    ),
  }),
  model({
    brandSlug: "signia",
    slug: "styletto-ix",
    name: "Styletto IX",
    style: "ric",
    summary:
      "A slim receiver-in-canal model entry listed for charging, handling, and format questions.",
    features: features(["rechargeable", "bluetoothStreaming", "appControl"]),
    image: "/images/products/signia/styletto-ix.png",
    imageAlt: "Signia Styletto IX hearing aid",
    ...manufacturerChecked(
      "Signia — Styletto IX",
      "https://www.signia.net/en-us/hearing-aids/integrated-xperience/styletto-ix/",
      "the model identity, slim RIC format, rechargeable option, Bluetooth streaming, and app control",
    ),
  }),
  model({
    brandSlug: "signia",
    slug: "motion-charge-go-ix",
    name: "Motion Charge&Go IX",
    style: "bte",
    summary:
      "A rechargeable behind-the-ear model entry presented for current product and fitting enquiries.",
    features: features([
      "rechargeable",
      "bluetoothStreaming",
      "appControl",
      "powerFormat",
    ]),
    image: "/images/products/signia/motion-chargego-ix.png",
    imageAlt: "Signia Motion Charge and Go IX behind-the-ear hearing aid",
    ...manufacturerChecked(
      "Signia — Motion Charge&Go IX",
      "https://www.signia.net/en-us/hearing-aids/integrated-xperience/motion-charge-go-ix/",
      "the model-family identity, behind-the-ear and power-format options, rechargeable option, Bluetooth streaming, and Signia app control",
    ),
  }),
  model({
    brandSlug: "widex",
    slug: "allure-ric-r-d",
    name: "Allure RIC R D",
    style: "ric",
    summary:
      "A rechargeable receiver-in-canal entry in the Widex Allure family, listed for current-information enquiries.",
    features: features(["rechargeable", "bluetoothStreaming", "appControl"]),
    image: "/images/products/widex/allure-ric-r-d.webp",
    imageAlt: "Widex Allure RIC R D hearing aid",
    ...manufacturerChecked(
      "Widex — Allure RIC R D",
      "https://www.widex.com/en/hearing-aids/allure/ric-r-d/",
      "the model identity, RIC format, rechargeable option, direct Bluetooth streaming, and Widex Allure app control",
    ),
  }),
  model({
    brandSlug: "widex",
    slug: "allure-bte-r-d",
    name: "Allure BTE R D",
    style: "bte",
    summary:
      "A rechargeable behind-the-ear entry in the Widex Allure family, presented as a format guide.",
    features: features(["rechargeable", "bluetoothStreaming", "appControl"]),
    image: "/images/products/widex/allure-bte-r-d.webp",
    imageAlt: "Widex Allure BTE R D hearing aid",
    ...manufacturerChecked(
      "Widex — Allure BTE R D",
      "https://www.widex.com/en-us/hearing-aids/allure/bte-r-d/",
      "the model identity, behind-the-ear format, rechargeable option, Bluetooth streaming, and Widex Allure app control",
    ),
  }),
  model({
    brandSlug: "widex",
    slug: "allure-ite-r-d",
    name: "Allure ITE R D",
    style: "ite",
    summary:
      "A rechargeable in-ear entry in the Widex Allure family, listed for current feature and format enquiries.",
    features: features([
      "rechargeable",
      "bluetoothStreaming",
      "appControl",
      "customFit",
    ]),
    image: "/images/products/widex/allure-ite-r-d.webp",
    imageAlt: "Widex Allure ITE R D in-ear hearing aid",
    ...manufacturerChecked(
      "Widex — Allure ITE R D",
      "https://www.widex.com/en-us/hearing-aids/allure/ite-r-d/",
      "the model identity, custom in-the-ear format, rechargeable option, Bluetooth streaming, and Widex Allure app control",
    ),
  }),
  model({
    brandSlug: "widex",
    slug: "smartric",
    name: "SmartRIC",
    style: "ric",
    summary:
      "A receiver-in-canal model entry listed for questions about charging, handling, and current specifications.",
    features: features(["rechargeable", "appControl"]),
    image: "/images/products/official/widex-smartric.jpg",
    imageAlt: "Widex SmartRIC hearing aid",
    ...manufacturerChecked(
      "Widex — SmartRIC",
      "https://www.widex.com/en-us/hearing-aids/smartric/",
      "the model identity, RIC format, rechargeable option, and Widex Moment app control",
    ),
  }),
  model({
    brandSlug: "widex",
    slug: "moment-sheer",
    name: "Moment Sheer sRIC R D",
    style: "ric",
    summary:
      "A Widex Moment family entry retained for a current model, style, and feature discussion.",
    features: features(["rechargeable", "bluetoothStreaming", "appControl"]),
    image: "/images/products/official/widex-moment.png",
    imageAlt: "Widex Moment Sheer sRIC R D hearing aid",
    ...manufacturerChecked(
      "Widex — Moment Sheer sRIC R D",
      "https://www.widex.com/en-us/hearing-aids/moment-sheer/sric-r-d/",
      "the exact model identity, RIC format, rechargeable option, direct Bluetooth streaming, and Widex Moment app control",
    ),
  }),
  model({
    brandSlug: "widex",
    slug: "beyond",
    name: "Widex Beyond",
    style: "various",
    summary:
      "A connected Widex model-family entry retained for current availability and compatibility questions.",
    features: features(["bluetoothStreaming", "appControl"]),
    image: "/images/products/official/widex-beyond.jpg",
    imageAlt: "Widex Beyond hearing aid",
    ...manufacturerChecked(
      "Widex — BEYOND official app and streaming guidance",
      "https://www.widex.com/en-au/blog/global/podcasts-and-hearing-aids/",
      "the BEYOND hearing-aid family identity, app compatibility, and direct phone streaming, while current availability remains unverified",
    ),
  }),
  model({
    brandSlug: "resound",
    slug: "vivia",
    name: "ReSound Vivia",
    style: "various",
    summary:
      "A ReSound Vivia family entry listed for current style, connectivity, and fitting enquiries.",
    features: features([
      "rechargeable",
      "bluetoothStreaming",
      "auracast",
      "appControl",
    ]),
    image: "/images/products/resound/vivia-black.png",
    imageAlt: "ReSound Vivia hearing aids",
    ...manufacturerChecked(
      "ReSound — Vivia",
      "https://www.resound.com/en-us/hearing-aids/resound-hearing-aids/resound-vivia",
      "the model-family identity, rechargeable family option, Bluetooth LE Audio streaming, Auracast support, and ReSound Smart 3D app control",
    ),
  }),
  model({
    brandSlug: "resound",
    slug: "savi",
    name: "ReSound Savi",
    style: "various",
    summary:
      "A ReSound Savi family entry presented for current style, charging, and connectivity questions.",
    features: features([
      "rechargeable",
      "bluetoothStreaming",
      "auracast",
      "appControl",
      "customFit",
    ]),
    image: "/images/products/resound/savi-sand.png",
    imageAlt: "ReSound Savi hearing aids",
    ...manufacturerChecked(
      "ReSound — Savi",
      "https://www.resound.com/en-us/hearing-aids/resound-hearing-aids/resound-savi",
      "the model-family identity, rechargeable and custom-format options, Bluetooth LE Audio streaming, Auracast support, and ReSound Smart 3D app control",
    ),
  }),
  model({
    brandSlug: "resound",
    slug: "nexia",
    name: "ReSound Nexia",
    style: "various",
    summary:
      "A ReSound Nexia family entry listed for current style and connectivity information.",
    features: features([
      "rechargeable",
      "bluetoothStreaming",
      "auracast",
      "appControl",
      "crosSupport",
      "powerFormat",
      "customFit",
    ]),
    image: "/images/products/official/resound-nexia.png",
    imageAlt: "ReSound Nexia hearing aid",
    ...manufacturerChecked(
      "ReSound — Nexia",
      "https://pro.resound.com/en-us/products/hearing-aids/nexia",
      "the model-family identity, multiple formats including power and custom options, rechargeable family option, Bluetooth LE Audio streaming, Auracast support, CROS options, and ReSound Smart 3D app control",
    ),
  }),
  model({
    brandSlug: "resound",
    slug: "omnia",
    name: "ReSound OMNIA",
    style: "various",
    summary:
      "A ReSound OMNIA family entry retained for current model, style, and feature enquiries.",
    features: features(["rechargeable", "appControl", "powerFormat", "customFit"]),
    image: "/images/products/official/resound-omnia.png",
    imageAlt: "ReSound OMNIA hearing aid",
    ...manufacturerChecked(
      "ReSound — OMNIA support",
      "https://www.resound.com/en-us/help/hearing-aids/omnia",
      "the model-family identity, multiple formats including power and custom options, rechargeable family options, and ReSound app controls",
    ),
  }),
  model({
    brandSlug: "resound",
    slug: "key",
    name: "ReSound Key",
    style: "various",
    summary:
      "A ReSound Key family entry listed for questions about current formats and connectivity options.",
    features: features(["rechargeable", "bluetoothStreaming", "appControl", "customFit"]),
    image: "/images/products/official/resound-key.png",
    imageAlt: "ReSound Key hearing aid",
    ...manufacturerChecked(
      "ReSound — Key",
      "https://pro.resound.com/en-us/products/hearing-aids/resound-key",
      "the model-family identity, multiple formats including custom options, rechargeable family option, Bluetooth streaming, and ReSound Smart 3D app control",
    ),
  }),
  model({
    brandSlug: "resound",
    slug: "vivia-rie",
    name: "ReSound Vivia RIE",
    style: "ric",
    summary:
      "A rechargeable receiver-in-ear Vivia entry listed for current connectivity and format enquiries.",
    features: features([
      "rechargeable",
      "bluetoothStreaming",
      "auracast",
      "appControl",
      "crosSupport",
    ]),
    image: "/images/products/resound/vivia-grey.png",
    imageAlt: "ReSound Vivia RIE hearing aids with charger",
    ...manufacturerChecked(
      "ReSound — Vivia RIE formats",
      "https://pro.resound.com/en-us/products/hearing-aids/vivia",
      "the Vivia family and its RIE formats, including rechargeable microRIE and CROS options, Bluetooth LE Audio streaming, Auracast support, and ReSound Smart 3D app control; the source does not present “Vivia RIE” as one standalone orderable model name",
    ),
  }),
  model({
    brandSlug: "oticon", slug: "intent", name: "Oticon Intent", style: "ric",
    summary: "An Oticon Intent family guide for current-information enquiries.", features: features(),
    image: "/images/products/oticon/intent.png", imageAlt: "Oticon Intent hearing aid",
    ...manufacturerChecked("Oticon — Intent", "https://www.oticon.com/hearing-aid-users/hearing-aids/oticon-intent", "the model-family identity"),
  }),
  model({
    brandSlug: "oticon", slug: "real", name: "Oticon Real", style: "ric",
    summary: "An Oticon Real family guide for current-information enquiries.", features: features(),
    image: "/images/products/oticon/real.png", imageAlt: "Oticon Real hearing aid",
    ...manufacturerChecked("Oticon — Real", "https://www.oticon.com/hearing-aid-users/hearing-aids/oticon-real", "the model-family identity"),
  }),
  model({
    brandSlug: "oticon", slug: "own-si", name: "Oticon Own SI", style: "ite",
    summary: "An Oticon Own SI custom in-ear family guide for current-information enquiries.", features: features(["customFit"]),
    image: "/images/products/oticon/own-si.png", imageAlt: "Oticon Own SI in-ear hearing aid",
    ...manufacturerChecked("Oticon — Own SI", "https://www.oticon.com/hearing-aid-users/hearing-aids/oticon-own-si", "the model-family identity and custom in-ear format"),
  }),
  model({
    brandSlug: "oticon", slug: "xceed", name: "Oticon Xceed", style: "bte",
    summary: "An Oticon Xceed power-format family guide for current-information enquiries.", features: features(["powerFormat"]),
    image: "/images/products/oticon/xceed.png", imageAlt: "Oticon Xceed behind-the-ear hearing aid",
    ...manufacturerChecked("Oticon — Xceed", "https://www.oticon.com/hearing-aid-users/hearing-aids/oticon-xceed", "the model-family identity and power behind-the-ear format"),
  }),
  model({
    brandSlug: "oticon", slug: "play-px", name: "Oticon Play PX", style: "bte",
    summary: "An Oticon Play PX pediatric family guide for current-information enquiries.", features: features(["pediatricPath"]),
    image: "/images/products/oticon/play-si.png", imageAlt: "Oticon hearing aid guidance image",
    ...manufacturerChecked("Oticon — Play PX", "https://www.oticon.com/hearing-aid-users/hearing-aids/oticon-play-px", "the model-family identity and pediatric pathway"),
  }),
  model({
    brandSlug: "oticon", slug: "zircon", name: "Oticon Zircon", style: "ric",
    summary: "An Oticon Zircon family guide for current-information enquiries.", features: features(),
    image: "/images/products/real-oticon-top-view.jpg", imageAlt: "Oticon hearing aid guidance image",
    ...manufacturerChecked("Oticon — Zircon", "https://www.oticon.com/hearing-aid-users/hearing-aids/oticon-zircon", "the model-family identity"),
  }),
  model({
    brandSlug: "starkey", slug: "genesis-ai", name: "Starkey Genesis AI", style: "ric",
    summary: "A Starkey Genesis AI family guide for current-information enquiries.", features: features(),
    image: "/images/products/official/starkey-genesis-ai.png", imageAlt: "Starkey Genesis AI hearing aid",
    ...manufacturerChecked("Starkey — Genesis AI", "https://www.starkey.com/hearing-aids/genesis-ai", "the model-family identity"),
  }),
  model({
    brandSlug: "starkey", slug: "evolv-ai", name: "Starkey Evolv AI", style: "ric",
    summary: "A Starkey Evolv AI family guide for current-information enquiries.", features: features(),
    image: "/images/products/official/starkey-evolv-ai.png", imageAlt: "Starkey Evolv AI hearing aid",
    ...manufacturerChecked("Starkey — Evolv AI", "https://www.starkey.com/hearing-aids/evolv-ai", "the model-family identity"),
  }),
  model({
    brandSlug: "starkey", slug: "picasso", name: "Starkey Picasso", style: "ite",
    summary: "A Starkey Picasso custom in-ear family guide for current-information enquiries.", features: features(["customFit"]),
    image: "/images/products/official/starkey-picasso.png", imageAlt: "Starkey Picasso in-ear hearing aid",
    ...manufacturerChecked("Starkey — Picasso", "https://www.starkey.com/hearing-aids/picasso", "the model-family identity and custom in-ear format"),
  }),
  model({
    brandSlug: "starkey", slug: "livio-edge-ai", name: "Starkey Livio Edge AI", style: "ric",
    summary: "A Starkey Livio Edge AI family guide for current-information enquiries.", features: features(),
    image: "/images/3d/generic-ric-fallback-v1.webp", imageAlt: "Generic receiver-in-canal hearing aid guidance image",
    ...manufacturerChecked("Starkey — Livio Edge AI", "https://www.starkey.com/hearing-aids/livio-edge-ai", "the model-family identity"),
  }),
] as const satisfies readonly CatalogModel[];

export const catalogModels = fallbackCatalogModels;

const uniqueModelKeys = new Set(catalogModels.map((entry) => entry.key));
if (uniqueModelKeys.size !== catalogModels.length) {
  throw new Error("Catalog fallback data contains a duplicate stable model key.");
}

export const catalogStyleLabels: Record<CatalogDeviceStyle, string> = {
  ric: "Receiver in canal (RIC/RIE)",
  bte: "Behind the ear (BTE)",
  ite: "In the ear (ITE)",
  cic: "In canal (CIC)",
  earbud: "Earbud style",
  cros: "CROS system",
  various: "Multiple or unconfirmed styles",
};

export const catalogFeatureLabels: Record<CatalogFeatureKey, string> = {
  rechargeable: "Rechargeable option",
  bluetoothStreaming: "Bluetooth or wireless streaming",
  auracast: "Auracast listed",
  appControl: "App control listed",
  crosSupport: "CROS pathway",
  pediatricPath: "Pediatric pathway",
  powerFormat: "Power-format pathway",
  customFit: "Custom-fit format",
};

export const triStateLabels: Record<TriState, string> = {
  yes: "Confirmed on the cited manufacturer source",
  no: "Explicitly listed as unavailable",
  unknown: "Not confirmed — ask for current details",
};

export function isCatalogBrandSlug(value: string): value is CatalogBrandSlug {
  return (catalogBrandSlugs as readonly string[]).includes(value);
}

export function isCatalogDeviceStyle(value: string): value is CatalogDeviceStyle {
  return (catalogDeviceStyles as readonly string[]).includes(value);
}

export function getCatalogBrand(slug: string): CatalogBrand | undefined {
  return catalogBrands.find((brand) => brand.slug === slug);
}

export function getStagedCatalogBrands(): readonly CatalogBrand[] {
  return catalogBrands.filter((brand) => brand.publication.status === "guidance-only");
}

export function getStagedCatalogModels(): readonly CatalogModel[] {
  return catalogModels.filter(
    (entry) =>
      entry.publication.status === "guidance-only" &&
      getCatalogBrand(entry.brandSlug)?.publication.status === "guidance-only",
  );
}

/**
 * Deliberately empty until an approved database record supplies explicit owner inventory approval.
 * Manufacturer-source checks and guidance staging never make a fallback record launch-eligible.
 */
const ownerApprovedCatalogModelCandidates: readonly CatalogModel[] = [];
const minimumOwnerApprovedModelsPerBrand = 4;

function getLaunchEligibleApprovedBrandSlugs(): ReadonlySet<CatalogBrandSlug> {
  const modelCounts = new Map<CatalogBrandSlug, number>();

  ownerApprovedCatalogModelCandidates.forEach((entry) => {
    modelCounts.set(entry.brandSlug, (modelCounts.get(entry.brandSlug) ?? 0) + 1);
  });

  return new Set(
    Array.from(modelCounts.entries())
      .filter(([, count]) => count >= minimumOwnerApprovedModelsPerBrand)
      .map(([brandSlug]) => brandSlug),
  );
}

export function getOwnerApprovedCatalogModels(): readonly CatalogModel[] {
  const eligibleBrandSlugs = getLaunchEligibleApprovedBrandSlugs();
  return ownerApprovedCatalogModelCandidates.filter((entry) =>
    eligibleBrandSlugs.has(entry.brandSlug),
  );
}

export function getOwnerApprovedCatalogBrands(): readonly CatalogBrand[] {
  const eligibleBrandSlugs = getLaunchEligibleApprovedBrandSlugs();
  return catalogBrands.filter((brand) => eligibleBrandSlugs.has(brand.slug));
}

export function getCatalogModelsByBrand(brandSlug: string): readonly CatalogModel[] {
  return getStagedCatalogModels().filter((entry) => entry.brandSlug === brandSlug);
}

export function getCatalogModel(brandSlug: string, modelSlug: string): CatalogModel | undefined {
  return getStagedCatalogModels().find(
    (entry) => entry.brandSlug === brandSlug && entry.slug === modelSlug,
  );
}

export function getCatalogModelByKey(key: string): CatalogModel | undefined {
  return getStagedCatalogModels().find((entry) => entry.key === key);
}

export function getCatalogModelPath(entry: Pick<CatalogModel, "brandSlug" | "slug">): string {
  return `/hearing-aids/${entry.brandSlug}/${entry.slug}`;
}

export function getCatalogModelFullName(entry: Pick<CatalogModel, "brandSlug" | "name">): string {
  const brand = getCatalogBrand(entry.brandSlug);
  if (!brand) return entry.name;

  return entry.name.toLocaleLowerCase("en-IN").startsWith(brand.name.toLocaleLowerCase("en-IN"))
    ? entry.name
    : `${brand.name} ${entry.name}`;
}

export function parseCatalogModelKeys(value: string | string[] | undefined): string[] {
  const raw = (Array.isArray(value) ? value.join(",") : value ?? "").slice(0, 4000);
  const uniqueKeys = new Set(
    raw
      .split(",")
      .map((key) => key.trim())
      .filter(Boolean),
  );

  return Array.from(uniqueKeys)
    .filter((key) => Boolean(getCatalogModelByKey(key)))
    .slice(0, 3);
}

export function filterCatalogModels(filters: CatalogFilterState): readonly CatalogModel[] {
  const normalizedQuery = filters.query?.trim().toLocaleLowerCase("en-IN") ?? "";

  return getStagedCatalogModels().filter((entry) => {
    const brand = getCatalogBrand(entry.brandSlug);

    if (filters.brand && entry.brandSlug !== filters.brand) return false;
    if (filters.style && entry.style !== filters.style) return false;
    if (filters.charging === "rechargeable" && entry.features.rechargeable !== "yes") return false;
    if (filters.charging === "unknown" && entry.features.rechargeable !== "unknown") return false;
    if (
      filters.connectivity === "bluetooth" &&
      entry.features.bluetoothStreaming !== "yes"
    ) {
      return false;
    }
    if (
      filters.connectivity === "unknown" &&
      entry.features.bluetoothStreaming !== "unknown"
    ) {
      return false;
    }

    if (
      normalizedQuery &&
      !`${brand?.name ?? ""} ${entry.name} ${catalogStyleLabels[entry.style]}`
        .toLocaleLowerCase("en-IN")
        .includes(normalizedQuery)
    ) {
      return false;
    }

    return true;
  });
}
