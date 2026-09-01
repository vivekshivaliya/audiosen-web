import Link from "next/link";
import { createPageMetadata } from "@/lib/page-metadata";
import { StructuredData } from "@/lib/structured-data";
import { verifiedExpertProfiles } from "@/lib/trust-content";

const expertsArePublished = verifiedExpertProfiles.length > 0;

export const metadata = createPageMetadata({
  title: "Verified Hearing-Care Experts | Audiosen",
  description:
    "Audiosen publishes professional profiles only after verifying identity, qualifications, registration information, role, and publication consent.",
  path: "/experts",
  image: "/images/editorial/hearing-care-careers-v2.webp",
  imageAlt: "Hearing-care professionals collaborating around audiology equipment",
  robots: {
    index: expertsArePublished,
    follow: true,
  },
});

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://audiosen.com/" },
    {
      "@type": "ListItem",
      position: 2,
      name: "Experts",
      item: "https://audiosen.com/experts",
    },
  ],
};

export default function ExpertsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <StructuredData data={breadcrumbJsonLd} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
        <Link href="/" className="hover:text-sky-800">
          Home
        </Link>
        <span aria-hidden="true"> / </span>
        <span>Experts</span>
      </nav>

      <section className="premium-shell p-8 sm:p-10">
        <p className="premium-eyebrow">Identity and credentials before publication</p>
        <h1 className="mt-4 font-display text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
          Verified Audiosen Expert Profiles
        </h1>
        <p className="premium-prose mt-6 max-w-4xl text-lg">
          Audiosen publishes a profile only after checking the person&apos;s identity, qualifications,
          registration information where applicable, current role and scope, biography,
          photograph consent, and permission to publish.
        </p>

        {verifiedExpertProfiles.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
            <h2 className="text-xl font-semibold">No professional profile is published yet</h2>
            <p className="mt-3 text-sm leading-relaxed">
              This is intentional: Audiosen has not supplied a complete verified profile record for
              public display. Names, qualifications, registration numbers, photographs, and review
              claims will not be invented or inferred.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {verifiedExpertProfiles.map((profile) => (
              <article key={profile.slug} className="premium-card p-6">
                <h2 className="text-2xl font-semibold text-slate-900">{profile.name}</h2>
                <p className="mt-2 font-semibold text-sky-800">{profile.professionalTitle}</p>
                <p className="premium-prose mt-3 text-sm">{profile.biography[0]}</p>
                <Link
                  href={`/experts/${profile.slug}`}
                  className="mt-5 inline-flex font-semibold text-sky-800 underline underline-offset-4"
                >
                  View verified profile
                </Link>
              </article>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/editorial-policy" className="premium-button-primary">
            Read the Editorial Policy
          </Link>
          <Link href="/contact" className="premium-button-secondary">
            Contact Audiosen
          </Link>
        </div>
      </section>
    </main>
  );
}
