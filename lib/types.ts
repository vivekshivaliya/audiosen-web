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
  interpretationGuide: string[];
  whoShouldNotRely: string[];
  reportNotes: string[];
}

export type HearingThreshold = number | "N/A";

export type HearingTestReliability = "good" | "fair" | "low";

export interface HearingTestSummary {
  completedAt: string;
  leftPta: HearingThreshold;
  rightPta: HearingThreshold;
  leftSeverity: string;
  rightSeverity: string;
  reliability: HearingTestReliability;
  reliabilityLabel: string;
  recommendation: string;
  notes: string[];
}

export interface SubscriptionPlan {
  id: "three_month" | "six_month" | "twelve_month";
  label: string;
  priceInr: number;
  badge?: string;
  coverage: string[];
}

export interface PriceBand {
  label: string;
  range: string;
  note: string;
}

export interface LocalFaqItem {
  question: string;
  answer: string;
}

export interface ClinicianProfile {
  name: string;
  title: string;
  credentials: string;
  registration: string;
  expertise: string;
  languages: string;
}

export interface LocalServicePageContent {
  slug:
    | "hearing-aids-dehradun"
    | "audiologist-dehradun"
    | "ent-clinic-dehradun"
    | "speech-therapy-dehradun";
  title: string;
  description: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSummary: string;
  heroSummaryHi: string;
  primaryIntent: string;
  treatmentList: string[];
  pricing: PriceBand[];
  trustPoints: string[];
  bilingualHighlights: string[];
  faqs: LocalFaqItem[];
}
