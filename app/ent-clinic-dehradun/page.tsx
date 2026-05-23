import type { Metadata } from "next";
import { LocalServicePage } from "@/components/local-service-page";
import { dehradunLocalPages } from "@/lib/content";

function getPageContent() {
  const page = dehradunLocalPages.find((item) => item.slug === "ent-clinic-dehradun");
  if (!page) {
    throw new Error("Missing local page content for ent-clinic-dehradun");
  }
  return page;
}

const pageContent = getPageContent();

export const metadata: Metadata = {
  title: pageContent.title,
  description: pageContent.description,
  alternates: {
    canonical: "/ent-clinic-dehradun",
  },
};

export default function EntClinicDehradunPage() {
  return <LocalServicePage content={pageContent} />;
}
