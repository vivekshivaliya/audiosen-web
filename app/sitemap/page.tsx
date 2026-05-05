import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";
import { infoPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Sitemap | Audiosen",
  description:
    "Browse Audiosen website sections, service pages, legal pages, and key hearing care information in one place.",
  alternates: {
    canonical: "/sitemap",
  },
};

export default function SitemapPage() {
  return <InfoPage content={infoPages.sitemap} />;
}
