import type { Metadata } from "next";
import { ApprovedOffer } from "@/components/approved-offer";
import { ProgramUnavailable } from "@/components/program-unavailable";
import { getActivePublicOffer } from "@/lib/offers/public";

const pagePath = "/hearing-aid-trial";
const pageUrl = `https://audiosen.com${pagePath}`;

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const program = await getActivePublicOffer("hearing-aid-trial");
  const title = program?.title ?? "Hearing Aid Trial Status | Audiosen";
  const description = program?.summary ??
    "Hearing-aid trials remain unpublished until exact eligibility, duration, pricing, deposit, return, warranty and fitting terms are approved.";
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

export default async function HearingAidTrialPage() {
  // Public loading independently requires an active Owner approval and the
  // complete approved database catalog. The staging catalog preview never
  // turns a trial draft into a public program.
  const program = await getActivePublicOffer("hearing-aid-trial");
  if (program) {
    return (
      <main id="main-content" className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <ApprovedOffer offer={program} />
      </main>
    );
  }

  return (
    <ProgramUnavailable
      eyebrow="Hearing aid trial"
      title="Trial terms are not approved for publication"
      description="The care team can discuss current assessment and device-access options, but the website does not promise a trial, device, duration, price or outcome until the complete program record is approved."
      checks={[
        "exact eligible models or services and location",
        "assessment, fitting and follow-up responsibilities",
        "duration, pricing, deposit and return process",
        "loss, damage, cancellation and warranty terms",
        "complete approved catalog and final owner approval",
      ]}
    />
  );
}
