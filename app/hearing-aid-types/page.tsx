import { createSeoLandingMetadata, SeoLandingPage } from "@/lib/seo-landing-page";
import { seoLandingPages } from "@/lib/seo-landing-pages";

const content = seoLandingPages.types;

export const metadata = createSeoLandingMetadata(content);

export default function HearingAidTypesPage() {
  return <SeoLandingPage content={content} />;
}
