import { InfoPage } from "@/components/info-page";
import { infoPages } from "@/lib/content";
import { createPageMetadata } from "@/lib/page-metadata";

const legalContentApproved = process.env.LEGAL_CONTENT_APPROVED === "true";

export const metadata = createPageMetadata({
  title: "Cancellation and Commercial Terms | Audiosen",
  description:
    "Review how Audiosen handles cancellation and commercial questions under the written terms supplied for a confirmed offline transaction.",
  path: "/refund-cancellation",
  image: infoPages.refundCancellation.image,
  imageAlt: infoPages.refundCancellation.imageAlt,
  robots: {
    index: legalContentApproved,
    follow: legalContentApproved,
  },
});

export default function RefundCancellationPage() {
  return <InfoPage content={infoPages.refundCancellation} canonicalPath="/refund-cancellation" />;
}
