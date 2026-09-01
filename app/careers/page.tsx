import { InfoPage } from "@/components/info-page";
import { brandIdentity, infoPages } from "@/lib/content";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata = createPageMetadata({
  title: `Careers & Expressions of Interest | ${brandIdentity.shortName}`,
  description:
    "Learn how to send Audiosen a general career expression of interest without implying that a vacancy is currently open.",
  path: "/careers",
  image: infoPages.careers.image,
  imageAlt: infoPages.careers.imageAlt,
  robots: { index: false, follow: true },
});

export default function CareersPage() {
  return <InfoPage content={infoPages.careers} canonicalPath="/careers" />;
}
