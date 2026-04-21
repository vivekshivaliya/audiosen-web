export type BrandSlug =
  | "phonak"
  | "oticon"
  | "signia"
  | "widex"
  | "resound"
  | "starkey";

export interface NavLink {
  label: string;
  href: string;
}

export interface HeroContent {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  sideNote: string;
}

export interface FeatureItem {
  title: string;
  description: string;
}

export interface BrandCard {
  slug: BrandSlug;
  name: string;
  summary: string;
}

export interface BrandProduct {
  tier: "high_end" | "mid_range" | "entry_level";
  title: string;
  description: string;
  image: string;
  highlights: string[];
}

export interface BrandDetail {
  slug: BrandSlug;
  heading: string;
  intro: string;
  products: BrandProduct[];
}

export interface ServiceItem {
  title: string;
  description: string;
  points: string[];
  image?: string;
  imageAlt?: string;
}

export interface Audiologist {
  name: string;
  role: string;
  bio: string;
  image?: string;
  imageAlt?: string;
}

export interface InfoPageContent {
  title: string;
  image?: string;
  imageAlt?: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface HearingTestContent {
  title: string;
  subtitle: string;
  helper: string;
  readyStatus: string;
  resultTitle: string;
  disclaimer: string;
  checklist: string[];
  steps: string[];
  reportNotes: string[];
}

export interface SubscriptionPlan {
  id: "three_month" | "six_month" | "twelve_month";
  label: string;
  priceInr: number;
  badge?: string;
  coverage: string[];
}
