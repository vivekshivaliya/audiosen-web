import Link from "next/link";
import {
  EnquiryRequestForm,
  type EnquiryServiceOption,
} from "@/components/enquiry-request-form";
import { callHref, clinicContact, whatsappHref } from "@/lib/content";
import { createPageMetadata } from "@/lib/page-metadata";
import { hearingServices, speechServices } from "@/lib/service-catalog";
import { StructuredData } from "@/lib/structured-data";

const pagePath = "/book-consultation";

export const metadata = createPageMetadata({
  title: "Book a Hearing or Speech Consultation | Audiosen",
  description:
    "Request an Audiosen hearing-care, hearing-device or speech-service consultation. The team confirms the professional pathway, location and appointment directly.",
  path: pagePath,
  image: "/images/editorial/audiosen-hero-consultation-v3.webp",
  imageAlt: "A hearing-care professional discussing consultation options with a patient",
});

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://audiosen.com/" },
    {
      "@type": "ListItem",
      position: 2,
      name: "Book a Consultation",
      item: `https://audiosen.com${pagePath}`,
    },
  ],
};

const generalOptions: EnquiryServiceOption[] = [
  { value: "general-hearing-consultation", label: "General hearing-care consultation" },
  { value: "care-plan-3-months", label: "Care Plan: 3 Months" },
  { value: "care-plan-6-months", label: "Care Plan: 6 Months" },
  { value: "care-plan-12-months", label: "Care Plan: 12 Months" },
  ...hearingServices.map((service) => ({ value: service.slug, label: service.title })),
  ...speechServices.map((service) => ({ value: service.slug, label: `Speech: ${service.title}` })),
];

const validServices = new Set(generalOptions.map((option) => option.value));
const speechServiceSlugs = new Set(speechServices.map((service) => service.slug));
const carePlanServiceSlugs = new Set([
  "care-plan-3-months",
  "care-plan-6-months",
  "care-plan-12-months",
]);

type PageProps = { searchParams: Promise<{ service?: string | string[] }> };

export default async function BookConsultationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requested = Array.isArray(params.service) ? params.service[0] : params.service;
  const selectedService = requested && validServices.has(requested)
    ? requested
    : "general-hearing-consultation";
  const speechJourney = speechServiceSlugs.has(selectedService);
  const carePlanJourney = carePlanServiceSlugs.has(selectedService);

  return (
    <main id="main-content">
      <StructuredData data={breadcrumbJsonLd} />
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#072d3d,#086166_58%,#5368a7)] text-white lg:grid-cols-[1.1fr_.9fr]">
          <div className="p-7 sm:p-11 lg:p-14">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-200">Secure appointment request</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] sm:text-6xl">
              Book an Audiosen Consultation
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-100">
              Choose a hearing or communication pathway and share a preferred time. This request
              does not confirm an appointment until the team verifies availability, provider and location.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={callHref} className="premium-button-primary border-white bg-white text-teal-950">Call {clinicContact.primaryCallDisplay}</a>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="premium-button-secondary border-white/40 bg-white/10 text-white">WhatsApp</a>
            </div>
          </div>
          <aside className="m-5 rounded-[1.5rem] border border-white/15 bg-white/10 p-7 backdrop-blur sm:m-8 lg:self-center">
            <h2 className="text-xl font-bold">Before you send</h2>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-100">
              <li>• Use a phone number the patient or guardian can answer.</li>
              <li>• Select the patient age group so the right pathway can be discussed.</li>
              <li>• Do not put an audiogram or private medical record in the message.</li>
              <li>• Urgent or sudden symptoms need prompt medical assessment.</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-20 pt-6 sm:px-6 lg:grid-cols-[.72fr_1.28fr] lg:px-8">
        <div>
          <p className="premium-eyebrow">What happens next</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-slate-950">A request, then a confirmed plan</h2>
          <ol className="mt-7 grid gap-3">
            {["Your request is stored with an opaque reference", "The team reviews the appropriate service pathway", "Appointment details are confirmed directly", "Patient and staff delivery are retried independently"].map((step, index) => (
              <li key={step} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-teal-950 text-xs font-bold text-white">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <Link href="/privacy-policy" className="mt-6 inline-flex font-bold text-teal-800 underline underline-offset-4">Read privacy and retention details</Link>
        </div>
        <EnquiryRequestForm
          type="appointment"
          variant={speechJourney ? "speech" : "consultation"}
          sourcePath="/book-consultation"
          service={selectedService}
          serviceOptions={generalOptions}
          speechServiceValues={[...speechServiceSlugs]}
          context={{ journey: carePlanJourney ? "care_plan_enquiry" : speechJourney ? "speech_consultation" : "book_consultation" }}
          heading={carePlanJourney ? "Ask about this Care Plan" : speechJourney ? "Request a speech consultation" : "Request a consultation"}
          intro={carePlanJourney
            ? "Share the minimum details needed for the team to confirm whether this care plan is suitable, the included support and the written commercial terms. This is an enquiry, not a payment or reservation."
            : "Share the minimum details needed to arrange a callback. Your selected service and preferred time are included in the private enquiry."}
          submitLabel={carePlanJourney ? "Send Care Plan Enquiry" : "Send Consultation Request"}
        />
      </section>
    </main>
  );
}
