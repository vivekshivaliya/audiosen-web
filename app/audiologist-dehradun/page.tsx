import type { Metadata } from "next";
import { LocalServicePage } from "@/components/local-service-page";
import { dehradunLocalPages } from "@/lib/content";

function getPageContent() {
  const page = dehradunLocalPages.find((item) => item.slug === "audiologist-dehradun");
  if (!page) {
    throw new Error("Missing local page content for audiologist-dehradun");
  }
  return page;
}

const pageContent = getPageContent();

export const metadata: Metadata = {
  title: pageContent.title,
  description: pageContent.description,
  alternates: {
    canonical: "/audiologist-dehradun",
  },
};

export default function AudiologistDehradunPage() {
  return <LocalServicePage content={pageContent} />;
}
