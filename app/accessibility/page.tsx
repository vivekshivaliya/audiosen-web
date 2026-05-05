import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";
import { infoPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Accessibility | Audiosen Hearing Care",
  description:
    "Read Audiosen's accessibility commitment and support options for elderly, mobility-limited, and first-time hearing care visitors.",
  alternates: {
    canonical: "/accessibility",
  },
};

export default function AccessibilityPage() {
  return <InfoPage content={infoPages.accessibility} />;
}
