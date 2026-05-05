import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";
import { infoPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy | Audiosen",
  description:
    "Review Audiosen refund and cancellation terms for consultations, device services, rentals, and hearing care plans.",
  alternates: {
    canonical: "/refund-cancellation",
  },
};

export default function RefundCancellationPage() {
  return <InfoPage content={infoPages.refundCancellation} />;
}
