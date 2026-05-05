import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";
import { infoPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy Policy | Audiosen",
  description:
    "Read how Audiosen collects, uses, stores, and protects personal information shared through our website and hearing care enquiries.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return <InfoPage content={infoPages.privacyPolicy} />;
}
