import { InfoPage } from "@/components/info-page";
import { infoPages } from "@/lib/content";
import { createPageMetadata } from "@/lib/page-metadata";

const legalContentApproved = process.env.LEGAL_CONTENT_APPROVED === "true";

export const metadata = createPageMetadata({
  title: "Privacy Policy | Audiosen",
  description:
    "Read how Audiosen collects, uses, stores, and protects personal information shared through our website and hearing care enquiries.",
  path: "/privacy-policy",
  image: infoPages.privacyPolicy.image,
  imageAlt: infoPages.privacyPolicy.imageAlt,
  robots: {
    index: legalContentApproved,
    follow: legalContentApproved,
  },
});

export default function PrivacyPolicyPage() {
  return <InfoPage content={infoPages.privacyPolicy} canonicalPath="/privacy-policy" />;
}
