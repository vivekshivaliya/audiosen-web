import type { Metadata } from "next";
import { LocalServicePage } from "@/components/local-service-page";
import { dehradunLocalPages } from "@/lib/content";

function getPageContent() {
  const page = dehradunLocalPages.find((item) => item.slug === "hearing-aids-dehradun");
  if (!page) {
    throw new Error("Missing local page content for hearing-aids-dehradun");
  }
  return page;
}

const pageContent = getPageContent();

export const metadata: Metadata = {
  title: pageContent.title,
  description: pageContent.description,
  alternates: {
    canonical: "/hearing-aids-dehradun",
  },
};

export default function HearingAidsDehradunPage() {
  return <LocalServicePage content={pageContent} />;
}
