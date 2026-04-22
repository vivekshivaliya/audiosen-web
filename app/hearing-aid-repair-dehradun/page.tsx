import type { Metadata } from "next";
import { AdLandingPageView } from "@/components/ad-landing-page";
import { adLandingPages } from "@/lib/ad-landing-pages";

const page = adLandingPages["hearing-aid-repair-dehradun"];

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  alternates: {
    canonical: `/${page.slug}`,
  },
};

export default function HearingAidRepairDehradunPage() {
  return <AdLandingPageView page={page} />;
}
