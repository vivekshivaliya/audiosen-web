import { LocalServicePage } from "@/components/local-service-page";
import { localServicePages } from "@/lib/local-service-pages";
import { createPageMetadata } from "@/lib/page-metadata";

const content = localServicePages.hearingAidFitting;

export const metadata = createPageMetadata({
  title: content.metaTitle,
  description: content.metaDescription,
  path: `/${content.slug}`,
  image: content.image,
  imageAlt: content.imageAlt,
});

export default function HearingAidFittingDehradunPage() {
  return <LocalServicePage content={content} />;
}
