import { createSeoLandingMetadata, SeoLandingPage } from "@/lib/seo-landing-page";
import { seoLandingPages } from "@/lib/seo-landing-pages";

const content = seoLandingPages.fittingAftercare;

export const metadata = createSeoLandingMetadata(content);

export default function HearingAidFittingAftercarePage() {
  return <SeoLandingPage content={content} />;
}
