import type { Metadata } from "next";
import { AdLandingPageView } from "@/components/ad-landing-page";
import { adLandingPages } from "@/lib/ad-landing-pages";

const page = adLandingPages["hearing-test-dehradun"];

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  alternates: {
    canonical: `/${page.slug}`,
  },
};

export default function HearingTestDehradunPage() {
  return <AdLandingPageView page={page} />;
}
