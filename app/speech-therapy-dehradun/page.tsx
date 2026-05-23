import type { Metadata } from "next";
import { LocalServicePage } from "@/components/local-service-page";
import { dehradunLocalPages } from "@/lib/content";

function getPageContent() {
  const page = dehradunLocalPages.find((item) => item.slug === "speech-therapy-dehradun");
  if (!page) {
    throw new Error("Missing local page content for speech-therapy-dehradun");
  }
  return page;
}

const pageContent = getPageContent();

export const metadata: Metadata = {
  title: pageContent.title,
  description: pageContent.description,
  alternates: {
    canonical: "/speech-therapy-dehradun",
  },
};

export default function SpeechTherapyDehradunPage() {
  return <LocalServicePage content={pageContent} />;
}
