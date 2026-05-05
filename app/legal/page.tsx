import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";
import { infoPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Legal Information | Audiosen",
  description:
    "Review Audiosen legal information, including privacy policy, terms of service, and refund and cancellation guidance.",
  alternates: {
    canonical: "/legal",
  },
};

export default function LegalPage() {
  return <InfoPage content={infoPages.legal} />;
}
