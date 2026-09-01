import { InfoPage } from "@/components/info-page";
import { brandIdentity, infoPages } from "@/lib/content";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata = createPageMetadata({
  title: `Accessibility | ${brandIdentity.organizationName}`,
  description:
    "Read Audiosen's accessibility commitment and support options for elderly, mobility-limited, and first-time hearing care visitors.",
  path: "/accessibility",
  image: infoPages.accessibility.image,
  imageAlt: infoPages.accessibility.imageAlt,
});

export default function AccessibilityPage() {
  return <InfoPage content={infoPages.accessibility} canonicalPath="/accessibility" />;
}
