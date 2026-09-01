import { InfoPage } from "@/components/info-page";
import { infoPages } from "@/lib/content";
import { createPageMetadata } from "@/lib/page-metadata";

const legalContentApproved = process.env.LEGAL_CONTENT_APPROVED === "true";

export const metadata = createPageMetadata({
  title: "Terms of Service | Audiosen",
  description:
    "Read the terms governing use of Audiosen's website, content, and hearing care service interactions.",
  path: "/terms-of-service",
  image: infoPages.termsOfService.image,
  imageAlt: infoPages.termsOfService.imageAlt,
  robots: {
    index: legalContentApproved,
    follow: legalContentApproved,
  },
});

export default function TermsOfServicePage() {
  return <InfoPage content={infoPages.termsOfService} canonicalPath="/terms-of-service" />;
}
