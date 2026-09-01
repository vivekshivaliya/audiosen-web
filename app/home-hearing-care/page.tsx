import Link from "next/link";
import { EnquiryRequestForm } from "@/components/enquiry-request-form";
import { createPageMetadata } from "@/lib/page-metadata";
import { StructuredData } from "@/lib/structured-data";

const pagePath = "/home-hearing-care";

export const metadata = createPageMetadata({
  title: "Home Hearing Care in Dehradun | Audiosen",
  description:
    "Request Audiosen home hearing-care support in the confirmed Dehradun service area. Scope, location, provider and appointment remain subject to direct confirmation.",
  path: pagePath,
  image: "/images/editorial/family-hearing-conversation-v2.webp",
  imageAlt: "A family discussing hearing support at home",
});

const availableToDiscuss = [
  "assessment and consultation planning",
  "existing hearing-aid handling or support",
  "fitting and follow-up needs",
  "cleaning or repair intake guidance",
];

const homeServiceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `https://audiosen.com${pagePath}#service`,
  name: "Home hearing-care enquiry in Dehradun",
  description:
    "A request pathway for confirmed home hearing-care services in the approved Dehradun service area.",
  url: `https://audiosen.com${pagePath}`,
  areaServed: { "@type": "City", name: "Dehradun" },
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
      name: "Home Hearing Care",
      item: `https://audiosen.com${pagePath}`,
    },
  ],
};

export default function HomeHearingCarePage() {
  return (
    <main id="main-content">
      <StructuredData data={[homeServiceJsonLd, breadcrumbJsonLd]} />
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid gap-8 rounded-[2rem] border border-teal-900/10 bg-[linear-gradient(135deg,#f8fffd,#d8f0eb)] p-7 sm:p-11 lg:grid-cols-[1.1fr_.9fr] lg:p-14">
          <div>
            <p className="premium-eyebrow">Dehradun service area</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] text-slate-950 sm:text-6xl">Home Hearing Care, Confirmed Around You</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              Home visits are requested—not automatically booked. Audiosen confirms that the
              location, professional pathway and requested service are supported before accepting an appointment.
            </p>
            <a href="#home-visit-form" className="premium-button-primary mt-8">Book Home Visit</a>
          </div>
          <aside className="rounded-[1.5rem] bg-teal-950 p-7 text-white">
            <h2 className="text-xl font-bold">Services available to discuss</h2>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-teal-50/85">
              {availableToDiscuss.map((item) => <li key={item} className="flex gap-3"><span aria-hidden="true" className="text-teal-300">✓</span>{item}</li>)}
            </ul>
            <p className="mt-6 border-t border-white/15 pt-5 text-sm leading-6 text-teal-100">
              India-wide enquiries receive guidance and coordination; this page does not promise nationwide home visits.
            </p>
          </aside>
        </div>
      </section>

      <section id="home-visit-guide" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl font-semibold text-slate-950">How a home-visit request works</h2>
        <ol className="mt-7 grid gap-4 md:grid-cols-4">
          {["Share patient age group, city and need", "Team checks the Dehradun service area", "Service and appointment are confirmed", "Care is documented with the appropriate follow-up"].map((step, index) => (
            <li key={step} className="rounded-2xl border border-slate-200 bg-white p-5"><span className="text-xs font-extrabold text-teal-700">STEP {index + 1}</span><p className="mt-3 text-sm leading-7 text-slate-700">{step}</p></li>
          ))}
        </ol>
      </section>

      <section id="home-visit-form" className="mx-auto grid max-w-7xl scroll-mt-28 gap-8 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[.72fr_1.28fr] lg:px-8">
        <div>
          <p className="premium-eyebrow">Request details</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-slate-950">Tell us who needs support</h2>
          <p className="mt-4 leading-7 text-slate-600">Do not include a full address in this form. The team collects exact visit details only after the initial request is accepted.</p>
          <Link href="#home-visit-guide" className="mt-6 inline-flex font-bold text-teal-800 underline underline-offset-4">Read the existing Dehradun guide</Link>
        </div>
        <EnquiryRequestForm
          type="home_visit"
          variant="home_visit"
          sourcePath={pagePath}
          service="Home hearing-care request"
          context={{ journey: "home_visit" }}
          heading="Request a home visit"
          intro="Share your city and a preferred date. The exact visit location is confirmed privately after service-area review."
          submitLabel="Send Home-Visit Request"
        />
      </section>
    </main>
  );
}
