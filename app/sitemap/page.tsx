import { InfoPage } from "@/components/info-page";
import { infoPages } from "@/lib/content";

export default function SitemapPage() {
  return <InfoPage content={infoPages.sitemap} />;
}
