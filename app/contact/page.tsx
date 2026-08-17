import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { callHref, clinicContact, whatsappHref } from "@/lib/content";

const pageUrl = "https://audiosen.com/contact";

export const metadata: Metadata = {
  title: "Contact Audiosen | Hearing Care Across India",
  description:
    "Contact Audiosen by WhatsApp, phone, email, or secure enquiry form for hearing-aid guidance and location-based support across India.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Audiosen | Hearing Care Across India",
    description:
      "Start a hearing-care enquiry online from anywhere in India or contact the verified Audiosen clinic in Dehradun.",
    url: pageUrl,
    siteName: "Audiosen",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/images/editorial/audiosen-hero-consultation-v3.webp",
        alt: "An Indian hearing-care professional supporting an older adult",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Audiosen | Hearing Care Across India",
    description: "WhatsApp, call, email, or send a hearing-care enquiry to Audiosen.",
    images: ["/images/editorial/audiosen-hero-consultation-v3.webp"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: "Contact Audiosen",
      description:
        "Contact options for Audiosen hearing-care guidance and location-based coordination across India.",
      inLanguage: "en-IN",
      mainEntity: { "@id": "https://audiosen.com/#organization" },
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
          name: "Contact",
          item: pageUrl,
        },
      ],
    },
  ],
};

const contactOptions = [
  {
    title: "WhatsApp consultation",
    description:
      "Share your city and the kind of hearing-care help you need. Do not send highly sensitive medical records until the team confirms a suitable secure route.",
    label: clinicContact.whatsappDisplay,
    href: whatsappHref,
    external: true,
  },
  {
    title: "Call Audiosen",
    description:
      "Use the main phone line for appointment questions, device guidance, fitting support, repair enquiries, or clinic directions.",
    label: clinicContact.primaryCallDisplay,
    href: callHref,
    external: false,
  },
  {
    title: "Email support",
    description:
      "Use email for non-urgent enquiries and written follow-up. Include your city and a safe callback number if you would like a response by phone.",
    label: clinicContact.email,
    href: `mailto:${clinicContact.email}`,
    external: false,
  },
];

export default function ContactPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
          <Link href="/" className="hover:text-sky-800">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Contact</span>
        </nav>

        <div className="premium-shell px-6 py-10 sm:px-10 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <p className="premium-eyebrow">Audiosen hearing-care enquiries</p>
              <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">
                Contact Audiosen Across India
              </h1>
              <p className="premium-prose mt-5 max-w-3xl text-lg">
                Start with a private conversation about hearing aids, assessment planning, fitting,
                aftercare, or repair. Audiosen accepts enquiries from across India and confirms the
                support available for each location.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="premium-button-primary"
                >
                  WhatsApp {clinicContact.whatsappDisplay}
                </a>
                <a href={callHref} className="premium-button-secondary">
                  Call {clinicContact.primaryCallDisplay}
                </a>
              </div>
            </div>

            <aside className="rounded-2xl border border-sky-100 bg-white/85 p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-800">
                Verified physical clinic
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">{clinicContact.company}</h2>
              <address className="premium-prose mt-3 not-italic">{clinicContact.formattedAddress}</address>
              <p className="mt-3 text-sm text-slate-600">
                {clinicContact.openingHoursText}. Confirm appointment and service availability before travelling.
              </p>
              <a
                href={clinicContact.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex font-semibold text-sky-800 underline decoration-sky-300 underline-offset-4"
              >
                Open directions in Google Maps
              </a>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {contactOptions.map((option) => (
            <article key={option.title} className="premium-card h-full p-6">
              <h2 className="text-2xl font-semibold text-slate-900">{option.title}</h2>
              <p className="premium-prose mt-3 text-sm">{option.description}</p>
              <a
                href={option.href}
                target={option.external ? "_blank" : undefined}
                rel={option.external ? "noopener noreferrer" : undefined}
                className="mt-5 inline-flex font-semibold text-sky-800 underline decoration-sky-300 underline-offset-4"
              >
                {option.label}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="premium-eyebrow">Secure website enquiry</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
            Tell us the next step you need
          </h2>
          <p className="premium-prose mt-4">
            Share your name, safe callback number, city, and a short description. Audiosen will use
            the details to respond to this enquiry and coordinate the available support.
          </p>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
            This website is not an emergency service. For urgent or severe symptoms, contact an
            appropriate qualified medical professional or emergency service. Website information
            does not provide a diagnosis.
          </div>
          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            By submitting the form, you ask Audiosen to contact you about this enquiry. Read the{" "}
            <Link href="/privacy-policy" className="font-semibold text-sky-800 underline underline-offset-4">
              Privacy Policy
            </Link>{" "}
            for how information is handled.
          </p>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
