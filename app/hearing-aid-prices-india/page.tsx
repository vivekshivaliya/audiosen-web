import { createSeoLandingMetadata, SeoLandingPage } from "@/lib/seo-landing-page";
import { seoLandingPages } from "@/lib/seo-landing-pages";

const content = seoLandingPages.pricesIndia;

export const metadata = createSeoLandingMetadata(content);

export default function HearingAidPricesIndiaPage() {
  return <SeoLandingPage content={content} />;
}
