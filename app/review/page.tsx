import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { getApprovedBusinessProfile } from "@/lib/business-profile";
import { getPublicGoogleReviews } from "@/lib/public-google-reviews";
import { StructuredData } from "@/lib/structured-data";

export const revalidate = 900;

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://audiosen.com/" },
    {
      "@type": "ListItem",
      position: 2,
      name: "Review Audiosen",
      item: "https://audiosen.com/review",
    },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getApprovedBusinessProfile();
  const isAvailable = Boolean(profile?.googleReviewUri);
  return {
    title: "Review Audiosen | Google Business Profile",
    description: isAvailable
      ? "Open Audiosen's genuine Google review form directly. Reviews are never gated or incentivized."
      : "Audiosen's verified Google review link is awaiting owner approval.",
    alternates: { canonical: "/review" },
    robots: { index: isAvailable, follow: isAvailable },
    openGraph: {
      title: "Review Audiosen",
      description: "Open Audiosen's approved Google review form directly.",
      url: "https://audiosen.com/review",
      siteName: "Audiosen",
      type: "website",
      locale: "en_IN",
      images: ["/og-image-v2.webp"],
    },
    twitter: {
      card: "summary_large_image",
      title: "Review Audiosen",
      description: "Open Audiosen's approved Google review form directly.",
      images: ["/og-image-v2.webp"],
    },
  };
}

export default async function ReviewPage() {
  const [profile, publicReviews] = await Promise.all([
    getApprovedBusinessProfile(),
    getPublicGoogleReviews(),
  ]);
  const reviewUri = profile?.googleReviewUri ?? null;
  const qrDataUri = reviewUri
    ? await QRCode.toDataURL(reviewUri, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 360,
        color: { dark: "#062c3b", light: "#ffffff" },
      })
    : null;

  return (
    <main id="main-content" className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <StructuredData data={breadcrumbJsonLd} />
      <section className="overflow-hidden rounded-[2rem] border border-teal-900/10 bg-white shadow-[0_30px_90px_-55px_rgba(4,45,57,.7)]">
        <div className="grid lg:grid-cols-[1.1fr_.9fr]">
          <div className="p-7 sm:p-10 lg:p-14">
            <p className="premium-eyebrow">Google review</p>
            <h1 className="mt-3 font-display text-5xl font-semibold text-slate-950 sm:text-6xl">
              Share your experience
            </h1>
            {reviewUri ? (
              <>
                <p className="mt-5 max-w-xl leading-8 text-slate-600">
                  This button opens Audiosen&apos;s owner-approved Google review form directly. Every
                  patient may leave honest feedback; reviews are never screened, gated or rewarded.
                </p>
                <a
                  href={reviewUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="premium-button-primary mt-8"
                  data-analytics-event="google_review_click"
                  data-analytics-location="review_page"
                >
                  Review Audiosen on Google
                </a>
                <p className="mt-5 text-sm leading-6 text-slate-500">
                  Google&apos;s own form opens in a new tab. Audiosen cannot edit a review submitted
                  there.
                </p>
              </>
            ) : (
              <>
                <p className="mt-5 max-w-xl leading-8 text-slate-600">
                  The genuine Google review URI is not yet available from an owner-approved Business
                  Profile snapshot. No guessed or constructed review link is published.
                </p>
                <Link href="/contact" className="premium-button-secondary mt-8">
                  Contact Audiosen
                </Link>
              </>
            )}
          </div>
          <div className="grid place-items-center bg-[linear-gradient(145deg,#e7f7f3,#c6e8e3)] p-8 text-center sm:p-12">
            {qrDataUri ? (
              <figure className="rounded-[1.75rem] border border-white/70 bg-white p-5 shadow-xl">
                <Image
                  src={qrDataUri}
                  width={360}
                  height={360}
                  unoptimized
                  alt="QR code opening Audiosen's Google review form"
                  className="h-auto w-full max-w-[18rem]"
                />
                <figcaption className="mt-3 max-w-[18rem] text-sm leading-6 text-slate-600">
                  Scan to open the same approved Google review link.
                </figcaption>
              </figure>
            ) : (
              <div className="max-w-sm rounded-[1.75rem] border border-white/70 bg-white/80 p-7">
                <span aria-hidden="true" className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-teal-950 text-3xl text-white">
                  ☆
                </span>
                <h2 className="mt-5 text-xl font-bold text-slate-950">Review link pending</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  The QR code will appear only after the Google Business connection and owner review.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {publicReviews.length > 0 ? (
        <section aria-labelledby="genuine-review-title" className="mt-12">
          <div className="max-w-3xl">
            <p className="premium-eyebrow">Selected Google reviews</p>
            <h2
              id="genuine-review-title"
              className="mt-3 font-display text-4xl font-semibold text-slate-950 sm:text-5xl"
            >
              Experiences shared by reviewers
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              These reviews were selected for public display from the currently approved Google
              Business Profile snapshot. Each reviewer&apos;s stored wording and star rating appears
              below without display edits.
            </p>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {publicReviews.map((review) => (
              <article
                key={review.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_-45px_rgba(5,49,60,.65)]"
              >
                <header className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-950">{review.reviewerDisplayName}</h3>
                    <time
                      className="mt-1 block text-xs text-slate-500"
                      dateTime={review.googleCreatedAt.toISOString()}
                    >
                      {new Intl.DateTimeFormat("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC",
                      }).format(review.googleCreatedAt)}
                    </time>
                  </div>
                  <p
                    aria-label={`${review.starRating} out of 5 stars`}
                    className="whitespace-nowrap font-bold text-amber-700"
                  >
                    <span aria-hidden="true">
                      {"★".repeat(review.starRating)}{"☆".repeat(5 - review.starRating)}
                    </span>{" "}
                    <span>{review.starRating}/5</span>
                  </p>
                </header>

                {review.comment !== null ? (
                  <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">
                    {review.comment}
                  </p>
                ) : null}

                <p className="mt-5 border-t border-slate-100 pt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Google review
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
