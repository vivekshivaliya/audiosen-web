import type { Metadata } from "next";
import { AdLandingPageView } from "@/components/ad-landing-page";
import { adLandingPages } from "@/lib/ad-landing-pages";

const page = adLandingPages["hearing-aids-dehradun"];

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  alternates: {
    canonical: `/${page.slug}`,
  },
};

export default function HearingAidsDehradunPage() {
  return <AdLandingPageView page={page} />;
}
