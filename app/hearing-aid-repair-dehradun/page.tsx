import type { Metadata } from "next";
import { LocalServicePage } from "@/components/local-service-page";
import { localServicePages } from "@/lib/local-service-pages";

const content = localServicePages.hearingAidRepair;

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
  alternates: { canonical: `/${content.slug}` },
  openGraph: {
    title: content.metaTitle,
    description: content.metaDescription,
    url: `https://audiosen.com/${content.slug}`,
    type: "website",
    locale: "en_IN",
  },
};

export default function HearingAidRepairDehradunPage() {
  return <LocalServicePage content={content} />;
}
