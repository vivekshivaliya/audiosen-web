import { InfoPage } from "@/components/info-page";
import { infoPages } from "@/lib/content";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata = createPageMetadata({
  title: "Sitemap | Audiosen",
  description:
    "Browse Audiosen website sections, service pages, legal pages, and key hearing care information in one place.",
  path: "/sitemap",
  image: infoPages.sitemap.image,
  imageAlt: infoPages.sitemap.imageAlt,
});

export default function SitemapPage() {
  return <InfoPage content={infoPages.sitemap} canonicalPath="/sitemap" />;
}
