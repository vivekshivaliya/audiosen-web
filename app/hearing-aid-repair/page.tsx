import Image from "next/image";
import Link from "next/link";
import { EnquiryRequestForm } from "@/components/enquiry-request-form";
import { createPageMetadata } from "@/lib/page-metadata";
import { StructuredData } from "@/lib/structured-data";

const pagePath = "/hearing-aid-repair";

export const metadata = createPageMetadata({
  title: "Hearing Aid Repair Request | Audiosen",
  description:
    "Request hearing-aid repair support with device details and an optional private quarantined photo. Serviceability and terms are confirmed after intake.",
  path: pagePath,
  image: "/images/editorial/hearing-aid-repair-support-v1.png",
  imageAlt: "Illustrative hearing-aid maintenance conversation between two adults",
});

const repairJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `https://audiosen.com${pagePath}#service`,
  name: "Hearing aid repair enquiry",
  description:
    "A secure intake pathway for hearing-aid inspection, cleaning, maintenance and repair guidance.",
  url: `https://audiosen.com${pagePath}`,
  areaServed: [{ "@type": "City", name: "Dehradun" }, { "@type": "Country", name: "India" }],
  provider: { "@id": "https://audiosen.com/#organization" },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://audiosen.com/" },
    {
      "@type": "ListItem",
      position: 2,
      name: "Hearing Aid Repair",
      item: `https://audiosen.com${pagePath}`,
    },
  ],
};

export default function HearingAidRepairPage() {
  return (
    <main id="main-content">
      <StructuredData data={[repairJsonLd, breadcrumbJsonLd]} />
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0a2f40,#0c6868_60%,#436a9d)] text-white lg:grid-cols-[1.05fr_.95fr]">
          <div className="p-7 sm:p-11 lg:p-14">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-200">Device-specific support</p>
            <h1 className="mt-4 max-w-4xl font-display text-5xl font-semibold leading-[1.02] sm:text-6xl">A Safer Hearing Aid Repair Intake</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-100">
              Share the brand, model and problem before travelling or shipping anything. Audiosen
              confirms the supported intake path, inspection scope and written terms first.
            </p>
            <a href="#repair-form" className="premium-button-primary mt-8 border-white bg-white text-teal-950">Request Repair</a>
          </div>
          <div className="relative min-h-72">
            <Image src="/images/editorial/hearing-aid-repair-support-v1.png" alt="Illustrative hearing-aid maintenance conversation between two adults" fill sizes="(max-width: 1023px) 100vw, 45vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["1", "Describe", "Record the brand, model, approximate age, warranty status and exact symptom."],
            ["2", "Confirm", "The team confirms whether an intake or coordinated service route is available."],
            ["3", "Approve", "Inspection, parts, charges, timeline and repair terms are agreed before work proceeds."],
          ].map(([number, title, text]) => (
            <article key={number} className="rounded-[1.5rem] border border-slate-200 bg-white p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-100 font-bold text-teal-900">{number}</span><h2 className="mt-5 text-xl font-bold text-slate-950">{title}</h2><p className="mt-3 text-sm leading-7 text-slate-600">{text}</p></article>
          ))}
        </div>
        <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
          Do not ship a device until Audiosen provides an authenticated intake reference and receiving instructions. Repair availability, warranty coverage, parts and outcome are never assumed.
        </p>
      </section>

      <section id="repair-form" className="mx-auto grid max-w-7xl scroll-mt-28 gap-8 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[.72fr_1.28fr] lg:px-8">
        <div>
          <p className="premium-eyebrow">Repair request</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-slate-950">Start with the device record</h2>
          <p className="mt-4 leading-7 text-slate-600">An optional image is validated by file signature and quarantined privately. It is never placed in the public product-media container.</p>
          <div className="mt-6 grid gap-3">
            <Link href="/hearing-aid-repair-dehradun" className="font-bold text-teal-800 underline underline-offset-4">Dehradun repair guide</Link>
            <Link href="/hearing-aid-repair-india" className="font-bold text-teal-800 underline underline-offset-4">India repair coordination guide</Link>
          </div>
        </div>
        <EnquiryRequestForm
          type="repair"
          variant="repair"
          sourcePath={pagePath}
          service="Hearing aid repair intake"
          context={{ journey: "repair" }}
          heading="Request repair assistance"
          intro="Provide the minimum details needed for the team to identify the appropriate intake route."
          submitLabel="Send Repair Request"
        />
      </section>
    </main>
  );
}
