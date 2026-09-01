import { InfoPage } from "@/components/info-page";
import { infoPages } from "@/lib/content";
import { createPageMetadata } from "@/lib/page-metadata";

const legalContentApproved = process.env.LEGAL_CONTENT_APPROVED === "true";

export const metadata = createPageMetadata({
  title: "Legal Information | Audiosen",
  description:
    "Review Audiosen legal information, including privacy policy, terms of service, and refund and cancellation guidance.",
  path: "/legal",
  image: infoPages.legal.image,
  imageAlt: infoPages.legal.imageAlt,
  robots: {
    index: legalContentApproved,
    follow: legalContentApproved,
  },
});

export default function LegalPage() {
  return <InfoPage content={infoPages.legal} canonicalPath="/legal" />;
}
