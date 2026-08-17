import { createSeoLandingMetadata, SeoLandingPage } from "@/lib/seo-landing-page";
import { seoLandingPages } from "@/lib/seo-landing-pages";

const content = seoLandingPages.repairIndia;

export const metadata = createSeoLandingMetadata(content);

export default function HearingAidRepairIndiaPage() {
  return <SeoLandingPage content={content} />;
}
