import type { Metadata } from "next";
import { ApprovedOffer } from "@/components/approved-offer";
import { ProgramUnavailable } from "@/components/program-unavailable";
import { getActivePublicOffer } from "@/lib/offers/public";

const pagePath = "/hearing-aid-rental";
const pageUrl = `https://audiosen.com${pagePath}`;

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const program = await getActivePublicOffer("hearing-aid-rental");
  const title = program?.title ?? "Hearing Aid Rental Status | Audiosen";
  const description = program?.summary ??
    "Hearing-aid rental plans remain unpublished until devices, prices, deposits, hygiene, warranty and return terms are approved.";
  return {
    title,
    description,
    alternates: { canonical: pagePath },
    robots: { index: Boolean(program), follow: true },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Audiosen",
      type: "website",
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HearingAidRentalPage() {
  const program = await getActivePublicOffer("hearing-aid-rental");
  if (program) {
    return (
      <main id="main-content" className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <ApprovedOffer offer={program} />
      </main>
    );
  }
  return (
    <ProgramUnavailable
      eyebrow="Hearing aid rental"
      title="Rental terms are not yet approved for publication"
      description="The care team can discuss current device-access options, but the website does not promise a rental, price or duration until the complete program record is approved."
      checks={[
        "eligible inventory and device condition",
        "monthly price and refundable deposit",
        "minimum duration and return process",
        "cleaning, loss, damage and warranty terms",
        "signed patient terms and owner approval",
      ]}
    />
  );
}
