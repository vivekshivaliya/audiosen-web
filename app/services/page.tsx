import Link from "next/link";
import { ServiceCard } from "@/components/service-card";
import { createPageMetadata } from "@/lib/page-metadata";
import { hearingServices } from "@/lib/service-catalog";
import { StructuredData } from "@/lib/structured-data";

export const metadata = createPageMetadata({
  title: "Hearing Care Services | Audiosen",
  description:
    "Explore Audiosen hearing assessment, hearing-aid consultation, fitting, programming, cleaning, maintenance, pediatric, senior and follow-up pathways.",
  path: "/services",
  image: "/images/editorial/hearing-test-consultation-v2.webp",
  imageAlt: "A hearing-care professional supporting a patient during an assessment",
});

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://audiosen.com/" },
    {
      "@type": "ListItem",
      position: 2,
      name: "Hearing Care Services",
      item: "https://audiosen.com/services",
    },
  ],
};

export default function ServicesPage() {
  return (
    <main>
      <StructuredData data={breadcrumbJsonLd} />
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <div className="rounded-[2rem] border border-teal-900/10 bg-[linear-gradient(135deg,rgba(255,255,255,.96),rgba(221,246,242,.9))] px-7 py-12 sm:px-11 lg:px-14">
          <p className="premium-eyebrow">Hearing care</p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl font-semibold leading-[1.02] text-slate-950 sm:text-6xl">
            Professional support from first concern to ongoing care
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-650">
            Choose a service to understand its purpose, process and next step. Audiosen confirms
            availability, location and the appropriate professional pathway before booking.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/book-consultation" className="premium-button-primary">
              Book Consultation
            </Link>
            <Link href="/speech-language-services" className="premium-button-secondary">
              Explore Speech &amp; Language
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="service-list-title" className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <h2 id="service-list-title" className="sr-only">
          Available hearing care pathways
        </h2>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {hearingServices.map((service, index) => (
            <ServiceCard key={service.slug} service={service} basePath="/services" index={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
