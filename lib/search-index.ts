import { blogPosts } from "@/lib/blog-posts";
import {
  catalogStyleLabels,
  getCatalogModelPath,
} from "@/lib/catalog/repository";
import { getActiveCatalogSnapshot } from "@/lib/catalog/runtime";
import {
  getSnapshotBrand,
  getSnapshotModelFullName,
} from "@/lib/catalog/snapshot";
import type { CatalogSnapshot } from "@/lib/catalog/types";
import { getActivePublicOffer } from "@/lib/offers/public";
import { hearingServices, speechServices } from "@/lib/service-catalog";

export type SearchRecord = {
  title: string;
  description: string;
  href: string;
  type: "Hearing aid" | "Hearing care" | "Speech & language" | "Guide" | "Article" | "Tool";
  keywords: string[];
};

const serviceRecords: SearchRecord[] = hearingServices.map((service) => ({
  title: service.title,
  description: service.shortDescription,
  href: service.canonicalPath ?? `/services/${service.slug}`,
  type: "Hearing care",
  keywords: [
    ...service.benefits,
    service.audience,
    ...service.faqs.flatMap((faq) => [faq.question, faq.answer]),
  ],
}));

const speechRecords: SearchRecord[] = speechServices.map((service) => ({
  title: service.title,
  description: service.shortDescription,
  href: `/speech-language-services/${service.slug}`,
  type: "Speech & language",
  keywords: [
    ...service.benefits,
    service.audience,
    ...service.faqs.flatMap((faq) => [faq.question, faq.answer]),
  ],
}));

function approvedCatalogSearchRecords(snapshot: CatalogSnapshot): SearchRecord[] {
  if (snapshot.mode !== "published") return [];
  const brandRecords: SearchRecord[] = snapshot.brands.map((brand) => ({
    title: `${brand.name} hearing-aid model guides`,
    description: brand.summary,
    href: `/hearing-aids/${brand.slug}`,
    type: "Guide",
    keywords: [
      brand.name,
      "hearing aid brand",
      ...snapshot.models
        .filter((model) => model.brandSlug === brand.slug)
        .map((model) => model.name),
    ],
  }));
  const modelRecords: SearchRecord[] = snapshot.models.map((model) => ({
    title: getSnapshotModelFullName(snapshot, model),
    description: model.summary,
    href: getCatalogModelPath(model),
    type: "Hearing aid",
    keywords: [
      getSnapshotBrand(snapshot, model.brandSlug)?.name ?? model.brandSlug,
      model.name,
      catalogStyleLabels[model.style],
      "owner-approved informational model guide",
      "request current information",
    ],
  }));
  return [...brandRecords, ...modelRecords];
}

const allGuides: SearchRecord[] = [
  {
    title: "Hearing Aid Model Guides",
    description: "Browse informational model guides and request current written information.",
    href: "/hearing-aids",
    type: "Guide",
    keywords: ["Phonak", "Signia", "Widex", "ReSound", "devices", "catalog"],
  },
  {
    title: "Hearing Aid Trial Information",
    description: "Ask whether an assessment-led hearing-aid trial path and written terms are available.",
    href: "/hearing-aid-trial",
    type: "Guide",
    keywords: ["trial", "terms", "assessment", "availability"],
  },
  {
    title: "Compare Hearing Aids",
    description: "Compare up to three staged guidance models in an accessible table.",
    href: "/compare-hearing-aids",
    type: "Tool",
    keywords: ["comparison", "rechargeable", "Bluetooth", "streaming"],
  },
  {
    title: "Find My Hearing Aid",
    description: "Rank source-supported staged options using stated, non-diagnostic preferences.",
    href: "/find-my-hearing-aid",
    type: "Tool",
    keywords: ["finder", "lifestyle", "charging", "visibility"],
  },
  {
    title: "Online Hearing Check",
    description: "A private, device-relative and non-diagnostic browser sound check.",
    href: "/hearing-test",
    type: "Tool",
    keywords: ["sound check", "screening", "headphones", "hearing test"],
  },
  {
    title: "Hearing Aid Types",
    description: "Learn about common hearing-aid styles and discussion points.",
    href: "/hearing-aid-types",
    type: "Guide",
    keywords: ["RIC", "BTE", "ITE", "CIC", "styles"],
  },
  {
    title: "Home Hearing Care",
    description: "Request a home-care appointment in the confirmed Dehradun service area.",
    href: "/home-hearing-care",
    type: "Hearing care",
    keywords: ["home visit", "Dehradun", "senior", "fitting"],
  },
  {
    title: "Hearing Aid Repair",
    description: "Submit device details and request a protected repair intake.",
    href: "/hearing-aid-repair",
    type: "Hearing care",
    keywords: ["repair", "cleaning", "maintenance", "device problem"],
  },
];

const stagedCatalogGuidePaths = new Set([
  "/hearing-aids",
  "/compare-hearing-aids",
  "/find-my-hearing-aid",
  "/hearing-aid-trial",
]);

const articleRecords: SearchRecord[] = blogPosts.map((post) => ({
  title: post.title,
  description: post.description,
  href: `/blog/${post.slug}`,
  type: "Article",
  keywords: [post.category, post.excerpt, ...post.sections.map((section) => section.heading)],
}));

export async function getPublicSearchIndex(): Promise<SearchRecord[]> {
  const [snapshot, activeTrial] = await Promise.all([
    getActiveCatalogSnapshot(),
    getActivePublicOffer("hearing-aid-trial"),
  ]);
  const guides = allGuides.filter((record) => {
    if (record.href === "/hearing-aid-trial") return Boolean(activeTrial);
    return Boolean(snapshot) || !stagedCatalogGuidePaths.has(record.href);
  });
  return [
    ...serviceRecords,
    ...speechRecords,
    ...(snapshot ? approvedCatalogSearchRecords(snapshot) : []),
    ...guides,
    ...articleRecords,
  ];
}

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function searchPublicContent(query: string): Promise<SearchRecord[]> {
  const normalizedQuery = normalize(query).slice(0, 80);
  if (normalizedQuery.length < 2) return [];
  const terms = normalizedQuery.split(/\s+/).filter(Boolean).slice(0, 8);
  const publicSearchIndex = await getPublicSearchIndex();

  return publicSearchIndex
    .map((record) => {
      const title = normalize(record.title);
      const description = normalize(record.description);
      const keywords = normalize(record.keywords.join(" "));
      const score = terms.reduce((total, term) => {
        if (title === term) return total + 12;
        if (title.includes(term)) return total + 7;
        if (keywords.includes(term)) return total + 4;
        if (description.includes(term)) return total + 2;
        return total;
      }, 0);
      return { record, score };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.record.title.localeCompare(right.record.title))
    .slice(0, 30)
    .map(({ record }) => record);
}
