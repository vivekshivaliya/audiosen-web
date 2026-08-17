import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVerifiedExpertProfile, verifiedExpertProfiles } from "@/lib/trust-content";

type ExpertPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return verifiedExpertProfiles.map((profile) => ({ slug: profile.slug }));
}

export async function generateMetadata({ params }: ExpertPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = getVerifiedExpertProfile(slug);

  if (!profile) {
    return {
      title: "Expert Profile Not Found | Audiosen",
      robots: { index: false, follow: true },
    };
  }

  return {
    title: `${profile.name} | Verified Expert | Audiosen`,
    description: `${profile.name} is a verified ${profile.professionalTitle} profiled by Audiosen. Review qualifications, registration, languages, and scope.`,
    alternates: { canonical: `/experts/${profile.slug}` },
    openGraph: {
      title: `${profile.name} | Audiosen`,
      description: `${profile.professionalTitle} — verified profile, qualifications, registration, languages, and scope.`,
      url: `https://audiosen.com/experts/${profile.slug}`,
      siteName: "Audiosen",
      type: "profile",
      locale: "en_IN",
      images: [{ url: profile.profileImage.src, alt: profile.profileImage.alt }],
    },
  };
}

export default async function ExpertPage({ params }: ExpertPageProps) {
  const { slug } = await params;
  const profile = getVerifiedExpertProfile(slug);

  if (!profile) notFound();

  const pageUrl = `https://audiosen.com/experts/${profile.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${pageUrl}#person`,
        name: profile.name,
        jobTitle: profile.professionalTitle,
        image: `https://audiosen.com${profile.profileImage.src}`,
        url: pageUrl,
        knowsLanguage: profile.languages,
        worksFor: { "@id": "https://audiosen.com/#organization" },
        hasCredential: profile.qualifications.map((qualification) => ({
          "@type": "EducationalOccupationalCredential",
          credentialCategory: "Qualification",
          name: qualification,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://audiosen.com/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Experts",
            item: "https://audiosen.com/experts",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: profile.name,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
        <Link href="/" className="hover:text-sky-800">
          Home
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href="/experts" className="hover:text-sky-800">
          Experts
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{profile.name}</span>
      </nav>

      <article className="premium-shell grid gap-8 p-8 sm:p-10 lg:grid-cols-[18rem_1fr]">
        <div>
          <Image
            src={profile.profileImage.src}
            alt={profile.profileImage.alt}
            width={640}
            height={800}
            priority
            className="w-full rounded-[1.5rem] object-cover"
          />
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Profile verification recorded {profile.profileVerifiedAt}.
          </p>
        </div>

        <div>
          <p className="premium-eyebrow">Verified Audiosen expert profile</p>
          <h1 className="mt-4 font-display text-5xl font-semibold text-slate-900">{profile.name}</h1>
          <p className="mt-3 text-xl font-semibold text-sky-800">{profile.professionalTitle}</p>

          <div className="premium-prose mt-6 space-y-4">
            {profile.biography.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <section className="premium-card p-5">
              <h2 className="text-xl font-semibold text-slate-900">Qualifications</h2>
              <ul className="mt-3 grid gap-2 text-sm text-slate-600">
                {profile.qualifications.map((qualification) => (
                  <li key={qualification}>{qualification}</li>
                ))}
              </ul>
            </section>
            <section className="premium-card p-5">
              <h2 className="text-xl font-semibold text-slate-900">Registration</h2>
              <p className="mt-3 text-sm text-slate-600">{profile.registration.authority}</p>
              <p className="mt-1 font-semibold text-slate-900">{profile.registration.number}</p>
              <p className="mt-2 text-xs text-slate-500">
                Verified {profile.registration.verifiedAt}
              </p>
            </section>
            <section className="premium-card p-5">
              <h2 className="text-xl font-semibold text-slate-900">Languages</h2>
              <p className="mt-3 text-sm text-slate-600">{profile.languages.join(", ")}</p>
            </section>
            <section className="premium-card p-5">
              <h2 className="text-xl font-semibold text-slate-900">Published scope</h2>
              <ul className="mt-3 grid gap-2 text-sm text-slate-600">
                {profile.scopeOfPractice.map((scope) => (
                  <li key={scope}>{scope}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </article>
    </main>
  );
}
