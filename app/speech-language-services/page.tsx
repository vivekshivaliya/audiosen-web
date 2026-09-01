import Image from "next/image";
import Link from "next/link";
import { ServiceCard } from "@/components/service-card";
import { createPageMetadata } from "@/lib/page-metadata";
import { speechServices } from "@/lib/service-catalog";
import { StructuredData } from "@/lib/structured-data";

export const metadata = createPageMetadata({
  title: "Speech Assessment Enquiries & Support | Audiosen",
  description:
    "Explore speech assessment enquiries and communication-support pathways with Audiosen. Provider, appointment and service availability are confirmed before booking.",
  path: "/speech-language-services",
  image: "/images/editorial/speech-communication-support-v1.png",
  imageAlt: "Illustrative communication-support conversation between two adults",
});

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://audiosen.com/" },
    {
      "@type": "ListItem",
      position: 2,
      name: "Speech & Language Services",
      item: "https://audiosen.com/speech-language-services",
    },
  ],
};

const speechEnquiryJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://audiosen.com/speech-language-services#service",
  name: "Speech assessment and communication-support enquiries",
  description:
    "Audiosen coordinates speech assessment enquiries and communication-support requests after confirming a suitable qualified provider, appointment, and service availability.",
  url: "https://audiosen.com/speech-language-services",
  serviceType: "Speech and communication support enquiry coordination",
  provider: { "@id": "https://audiosen.com/#organization" },
  areaServed: [
    { "@type": "City", name: "Dehradun" },
    { "@type": "Country", name: "India" },
  ],
};

const signs = [
  "delayed words or limited vocabulary",
  "speech that is difficult to understand",
  "pronunciation or fluency concerns",
  "difficulty following verbal instructions",
  "repeatedly asking for repetition",
  "suspected hearing difficulty",
];

export default function SpeechLanguageServicesPage() {
  return (
    <main>
      <StructuredData data={[speechEnquiryJsonLd, breadcrumbJsonLd]} />
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#182d50,#155f69_62%,#438b83)] text-white lg:grid-cols-[1.15fr_.85fr]">
          <div className="p-7 sm:p-11 lg:p-14">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-teal-200">
              Speech &amp; communication
            </p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] sm:text-6xl">
              Communication support starts by listening well
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-100">
              Explore assessment-led speech and language pathways. Services are offered only when
              an appropriately qualified professional and suitable appointment pathway are confirmed.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book-consultation?service=speech-assessment" className="premium-button-primary border-white bg-white text-teal-950">
                Book Speech Consultation
              </Link>
              <Link href="/services/pediatric-hearing-care" className="premium-button-secondary border-white/40 bg-white/10 text-white">
                Pediatric Hearing Care
              </Link>
            </div>
          </div>
          <div className="m-5 overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/10 sm:m-8">
            <div className="relative min-h-64">
              <Image src="/images/editorial/speech-communication-support-v1.png" alt="Illustrative communication-support conversation between two adults" fill sizes="(max-width: 1023px) 100vw, 40vw" className="object-cover" />
            </div>
            <aside className="p-7 backdrop-blur">
              <h2 className="font-display text-3xl font-semibold">Concerned about a child?</h2>
              <p className="mt-3 text-sm leading-7 text-slate-100">
                These observations can be useful to discuss, but they do not confirm a diagnosis.
              </p>
              <ul className="mt-5 grid gap-2 text-sm text-white">
                {signs.map((sign) => (
                  <li key={sign} className="flex gap-2">
                    <span aria-hidden="true" className="text-teal-200">●</span>
                    {sign}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      <section aria-labelledby="speech-service-title" className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="premium-eyebrow">Service pathways</p>
          <h2 id="speech-service-title" className="mt-3 font-display text-4xl font-semibold text-slate-950 sm:text-5xl">
            Choose the concern you want to discuss
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {speechServices.map((service, index) => (
            <ServiceCard key={service.slug} service={service} basePath="/speech-language-services" index={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
