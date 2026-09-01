import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HearingAidFinder } from "@/components/catalog/hearing-aid-finder";
import { StructuredData } from "@/components/catalog/structured-data";
import { getActiveCatalogSnapshot } from "@/lib/catalog/runtime";

const pagePath = "/find-my-hearing-aid";
const pageUrl = `https://audiosen.com${pagePath}`;

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await getActiveCatalogSnapshot();
  if (!snapshot) notFound();
  const social = {
    title: "Hearing-Aid Preference Organiser | Audiosen",
    description:
      "Capture stated preferences without inferring suitability, price, or service availability.",
  };
  return {
    title: "Find My Hearing-Aid Guide | Preference Organiser | Audiosen",
    description:
      "Organise non-diagnostic hearing-aid preferences privately in the browser and rank only model attributes supported by a dated confirmed source. Children follow a pediatric path.",
    alternates: { canonical: pagePath },
    robots: { index: snapshot.mode === "published", follow: true },
    referrer: "no-referrer",
    openGraph: {
      ...social,
      url: pageUrl,
      siteName: "Audiosen",
      type: "website",
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image", ...social },
  };
}

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: "Hearing-aid preference organiser",
      description:
        "A private, non-diagnostic preference organiser with verified-attribute scoring and a separate pediatric pathway.",
      inLanguage: "en-IN",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://audiosen.com/" },
        { "@type": "ListItem", position: 2, name: "Hearing aids", item: "https://audiosen.com/hearing-aids" },
        { "@type": "ListItem", position: 3, name: "Preference organiser", item: pageUrl },
      ],
    },
  ],
};

export default async function FindMyHearingAidPage() {
  const snapshot = await getActiveCatalogSnapshot();
  if (!snapshot) notFound();

  return (
    <main>
      <StructuredData data={structuredData} />

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
          <Link href="/" className="hover:text-teal-800">Home</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/hearing-aids" className="hover:text-teal-800">Hearing aids</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Preference organiser</span>
        </nav>

        <div className="premium-shell px-6 py-10 sm:px-10 lg:py-14">
          <p className="premium-eyebrow">Decision support, not diagnosis</p>
          <h1 className="mt-4 max-w-5xl font-display text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">
            Organise What You Want to Explore
          </h1>
          <p className="premium-prose mt-5 max-w-4xl text-lg">
            Capture practical preferences without estimating hearing level, medical need, device
            suitability, price, or local service availability. A model can enter the ranked result
            only when the compared attributes have a dated confirmed source and an approved or preview-safe status.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <aside className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-relaxed text-sky-950">
              <strong>Children:</strong> anyone under 18 is diverted to the pediatric clinical path.
              No adult product ranking is generated, and a guardian must consent before an enquiry is sent.
            </aside>
            <aside className="rounded-2xl border border-teal-200 bg-teal-50 p-5 text-sm leading-relaxed text-teal-950">
              <strong>Privacy:</strong> choices stay in this tab&apos;s memory and are never written to
              the URL, browser history, referrer, or analytics. Refreshing clears them. They leave
              the page only if you deliberately submit the protected enquiry form.
            </aside>
          </div>
        </div>
      </section>

      <HearingAidFinder snapshot={snapshot} />
    </main>
  );
}
