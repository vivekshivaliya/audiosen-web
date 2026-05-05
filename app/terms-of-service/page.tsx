import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";
import { infoPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Terms of Service | Audiosen",
  description:
    "Read the terms governing use of Audiosen's website, content, and hearing care service interactions.",
  alternates: {
    canonical: "/terms-of-service",
  },
};

export default function TermsOfServicePage() {
  return <InfoPage content={infoPages.termsOfService} />;
}
