import { InfoPage } from "@/components/info-page";
import { infoPages } from "@/lib/content";

export default function AccessibilityPage() {
  return <InfoPage content={infoPages.accessibility} />;
}
