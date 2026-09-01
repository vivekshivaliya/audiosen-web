import type { Metadata } from "next";
import { ApprovedOffer } from "@/components/approved-offer";
import { ProgramUnavailable } from "@/components/program-unavailable";
import { getActivePublicOffers } from "@/lib/offers/public";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const offers = await getActivePublicOffers();
  const description = offers.length
    ? "Review Audiosen offers and commercial programs with exact eligibility, approved dates and complete written terms."
    : "Audiosen publishes hearing-care offers and programs only after eligibility, dates and complete written terms are approved.";
  return {
    title: "Hearing Care Offers and Programs | Audiosen",
    description,
    alternates: { canonical: "/offers" },
    robots: { index: offers.length > 0, follow: true },
    openGraph: {
      title: "Hearing Care Offers and Programs | Audiosen",
      description,
      url: "https://audiosen.com/offers",
      siteName: "Audiosen",
      type: "website",
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image", title: "Hearing Care Offers and Programs | Audiosen", description },
  };
}

export default async function OffersPage() {
  const offers = await getActivePublicOffers();
  if (offers.length) {
    return (
      <main id="main-content" className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <header className="mb-9 max-w-4xl">
          <p className="premium-eyebrow">Audiosen commercial programs</p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] text-slate-950 sm:text-6xl">Approved hearing-care offers and programs</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">Only active, Owner-approved records with exact eligibility, dates and complete written terms appear here.</p>
        </header>
        <div className="grid gap-8">
          {offers.map((offer) => <ApprovedOffer key={offer.id} offer={offer} compact />)}
        </div>
      </main>
    );
  }
  return (
    <ProgramUnavailable
      eyebrow="Audiosen commercial programs"
      title="No public offer or program is active right now"
      description="Ask the care team for current written options. A future offer, rental, care plan or trial will appear only after every eligible product or service and its dates, terms and approval are recorded."
      checks={[
        "eligible hearing devices or services",
        "start and end dates",
        "pricing and any exact campaign saving",
        "deposit, warranty and trial applicability",
        "written terms and owner approval",
      ]}
    />
  );
}
