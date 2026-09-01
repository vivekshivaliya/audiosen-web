import type { Metadata } from "next";
import { ApprovedOffer } from "@/components/approved-offer";
import { ProgramUnavailable } from "@/components/program-unavailable";
import { getActivePublicOffer } from "@/lib/offers/public";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const offer = await getActivePublicOffer("50-percent-off");
  const title = offer?.title ?? "Up to 50% Campaign Status | Audiosen";
  const description = offer?.summary ??
    "The Audiosen up-to-50-percent campaign is not published while product eligibility, dates and written terms await approval.";
  return {
    title,
    description,
    alternates: { canonical: "/offers/50-percent-off" },
    robots: { index: Boolean(offer), follow: true },
    openGraph: {
      title,
      description,
      url: "https://audiosen.com/offers/50-percent-off",
      siteName: "Audiosen",
      type: "website",
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function FiftyPercentOfferPage() {
  const offer = await getActivePublicOffer("50-percent-off");
  if (offer) {
    return (
      <main id="main-content" className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <ApprovedOffer offer={offer} />
      </main>
    );
  }
  return (
    <ProgramUnavailable
      eyebrow="Campaign status"
      title="The up-to-50% campaign is awaiting approval"
      description="No device is currently labelled eligible on the public website. Audiosen will activate this page only for exact mapped hearing-aid models during an approved campaign period."
      checks={[
        "specific eligible hearing-aid models",
        "how the maximum saving is calculated",
        "campaign dates and exclusions",
        "price, stock, fitting and warranty terms",
        "final owner approval",
      ]}
    />
  );
}
