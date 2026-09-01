import { LocalServicePage } from "@/components/local-service-page";
import { localServicePages } from "@/lib/local-service-pages";
import { createPageMetadata } from "@/lib/page-metadata";

const content = localServicePages.hearingTest;

export const metadata = createPageMetadata({
  title: content.metaTitle,
  description: content.metaDescription,
  path: `/${content.slug}`,
  image: content.image,
  imageAlt: content.imageAlt,
});

export default function HearingTestDehradunPage() {
  return <LocalServicePage content={content} />;
}
