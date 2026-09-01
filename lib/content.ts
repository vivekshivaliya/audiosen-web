import type {
  HearingTestContent,
  InfoPageContent,
  SubscriptionPlan,
} from "@/lib/types";

export const brandIdentity = {
  shortName: "Audiosen",
  organizationName: "Audiosen Advance Hearing Care Solutions",
  subtitle: "Advance Hearing Care Solutions",
} as const;

const approvedClinicAddress = "7, 11, Ram Vihar St, near ONGC Hospital, Dehradun, Uttarakhand 248001";
const approvedClinicMapsUrl = "https://maps.app.goo.gl/aS14X1JqjBfKv3TS7";

export const siteMeta = {
  title: `${brandIdentity.shortName} | Hearing & Communication Care`,
  description:
    `Explore hearing-device guidance, an online sound check, repair support, and communication services across India from ${brandIdentity.shortName}.`,
  keywords:
    "hearing care Dehradun, hearing aid guidance India, online hearing sound check, hearing aid fitting, hearing aid repair, speech and language services",
  canonicalUrl: "https://audiosen.com/",
  ogImage: "https://audiosen.com/og-image-v2.webp",
  logo: "https://audiosen.com/audiosen-company-logo.png",
};

export const clinicContact = {
  company: brandIdentity.organizationName,
  email: "support@audiosen.com",
  locality: "Dehradun",
  region: "Uttarakhand",
  postalCode: "248001",
  countryCode: "IN",
  addressLine1: "7, 11, Ram Vihar St, near ONGC Hospital",
  address: approvedClinicAddress,
  primaryCallDisplay: "8923092563",
  primaryCallE164: "+918923092563",
  whatsappDisplay: "8923092563",
  whatsappE164: "+918923092563",
  mapsHref: approvedClinicMapsUrl,
};

export const callHref = `tel:${clinicContact.primaryCallE164}`;

export const whatsappHref = `https://wa.me/${clinicContact.whatsappE164.replace(/\D/g, "")}?text=${encodeURIComponent(
  "Hello, I would like to know more about Audiosen hearing care services.",
)}`;

export const subscriptionPlans: readonly SubscriptionPlan[] = [
  {
    id: "three_month",
    label: "3 Months Care Plan",
    priceInr: 2999,
    badge: "Entry",
    coverage: [
      "1 hearing screening / consultation",
      "1 device fitting review",
      "1 cleaning / maintenance visit",
      "WhatsApp support for the plan duration",
    ],
  },
  {
    id: "six_month",
    label: "6 Months Care Plan",
    priceInr: 4999,
    badge: "Recommended",
    coverage: [
      "1 hearing screening / consultation",
      "2 tuning / re-programming sessions",
      "2 cleaning / maintenance visits",
      "Priority service support",
      "Discount on consumables",
    ],
  },
  {
    id: "twelve_month",
    label: "12 Months Care Plan",
    priceInr: 8999,
    badge: "Best value",
    coverage: [
      "2 hearing screenings / consultations",
      "4 tuning / re-programming sessions",
      "4 cleaning / maintenance visits",
      "Priority repair support",
      "Accessory discount support",
    ],
  },
];

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://audiosen.com/#organization",
  name: brandIdentity.shortName,
  alternateName: brandIdentity.organizationName,
  url: "https://audiosen.com/",
  logo: siteMeta.logo,
  image: siteMeta.ogImage,
  telephone: clinicContact.primaryCallE164,
  email: clinicContact.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: clinicContact.addressLine1,
    addressLocality: clinicContact.locality,
    addressRegion: clinicContact.region,
    postalCode: clinicContact.postalCode,
    addressCountry: clinicContact.countryCode,
  },
  hasMap: clinicContact.mapsHref,
  geo: {
    "@type": "GeoCoordinates",
    latitude: 30.3363904,
    longitude: 78.0157661,
  },
  description: siteMeta.description,
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: clinicContact.primaryCallE164,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English"],
    },
    {
      "@type": "ContactPoint",
      telephone: clinicContact.whatsappE164,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English"],
    },
  ],
  knowsAbout: [
    "Hearing assessments",
    "Hearing aid fitting coordination",
    "Hearing aid repair guidance",
    "Hearing aid aftercare",
    "Phonak hearing aids",
    "Signia hearing aids",
    "Widex hearing aids",
    "ReSound hearing aids",
  ],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://audiosen.com/#website",
  url: "https://audiosen.com/",
  name: brandIdentity.shortName,
  alternateName: brandIdentity.organizationName,
  inLanguage: "en-IN",
  publisher: {
    "@id": "https://audiosen.com/#organization",
  },
};

export const dehradunClinicJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://audiosen.com/#dehradun-hearing-care-enquiries",
  name: "Audiosen hearing-care enquiries in Dehradun",
  url: "https://audiosen.com/hearing-aids-dehradun",
  serviceType: "Hearing-care enquiry coordination",
  telephone: clinicContact.primaryCallE164,
  email: clinicContact.email,
  provider: {
    "@id": "https://audiosen.com/#organization",
  },
  areaServed: {
    "@type": "City",
    name: "Dehradun",
  },
};

export const hearingTestContent: HearingTestContent = {
  title: "Audiosen Sound Check",
  subtitle: "A private, device-relative ear-by-ear check that helps you choose a sensible next step.",
  helper:
    "Use stereo headphones in a quiet room. Keep your device volume comfortable—never turn it up to chase a tone.",
  readyStatus: "Complete the safety and setup checks to begin.",
  resultTitle: "Your Device Check Summary",
  disclaimer:
    "This browser check is not calibrated, cannot measure dB HL, and is not a medical diagnosis or audiogram. A clinic assessment is required to measure hearing levels and investigate causes.",
  checklist: [
    "Use headphones or earphones",
    "Sit in a quiet room",
    "Stop if any sound feels uncomfortable",
  ],
  steps: [
    "Wear stereo headphones and sit in a quiet room",
    "Set a comfortable reference sound—do not keep increasing it",
    "Check four speech-related tone regions in each ear",
    "Review device-relative observations and choose your next step",
  ],
  interpretationGuide: [
    "The tone count only describes what you noticed with this device, browser, headphones, room, and volume setting.",
    "It does not label hearing as normal, mild, moderate, or severe and cannot calculate a clinical PTA.",
    "Response consistency describes repeat and silent checks; low consistency means the result should not be interpreted.",
    "Book a full clinic evaluation whenever everyday speech, calls, meetings, or background noise are difficult—even if every tone was noticed.",
  ],
  whoShouldNotRely: [
    "Children should use a clinic-based pediatric hearing evaluation instead of this browser check.",
    "Do not continue if you have sudden hearing change, severe ear pain, discharge, injury, or active infection.",
    "With significant dizziness, neurological symptoms, or a sudden one-sided change, seek urgent medical assessment first.",
  ],
  reportNotes: [
    "Results vary with headphones, device volume, browser audio processing, and room noise.",
    "A clinical audiology test is recommended if you notice difficulty with speech, calls, meetings, tinnitus, or background noise.",
  ],
};

export const footerContact = {
  company: clinicContact.company,
  copyright: "Copyright 2026 - Better hearing, better living",
  location: clinicContact.address,
  callDisplay: clinicContact.primaryCallDisplay,
  callHref,
  whatsappDisplay: clinicContact.whatsappDisplay,
  whatsappHref,
  gmail: clinicContact.email,
};

export const infoPages: Record<
  | "about"
  | "careers"
  | "blog"
  | "accessibility"
  | "sitemap"
  | "legal"
  | "privacyPolicy"
  | "termsOfService"
  | "refundCancellation",
  InfoPageContent
> = {
  about: {
    title: "About Audiosen",
    image: "/images/editorial/hearing-test-consultation-v2.webp",
    imageAlt: "An Audiosen-style hearing consultation with an older Indian patient",
    paragraphs: [
      "Audiosen is an India-focused hearing-care startup offering consultation, hearing-assessment planning, hearing-device guidance, fitting coordination, repair guidance, and ongoing support.",
      "Audiosen accepts enquiries from children, adults, seniors, and families across India for online guidance and location-appropriate coordination. Clinic and home-care scope is confirmed before booking.",
      "Our mission is to make trustworthy, understandable hearing guidance easier to access while keeping every in-person service promise location-specific.",
    ],
  },
  careers: {
    title: "Careers and Expressions of Interest",
    image: "/images/editorial/hearing-care-careers-v2.webp",
    imageAlt: "Indian hearing-care professionals collaborating around audiology equipment",
    paragraphs: [
      "Audiosen accepts general career expressions of interest. This page does not confirm that a vacancy, position, location, salary, or recruitment timeline is currently open.",
      "If you would like to be considered when a suitable role is confirmed, send your CV to support@audiosen.com with the subject line \"Career Expression of Interest - [Area]\".",
    ],
    bullets: [
      "Clinical hearing care - identity, qualifications, registration, scope, and exact role terms are checked before any appointment.",
      "Technical support - repair capability, supervision, location, and exact role terms are confirmed for any opening.",
      "Patient coordination - responsibilities, working arrangement, and exact role terms are confirmed for any opening.",
    ],
  },
  blog: {
    title: "Audiosen Hearing Blog",
    paragraphs: ["Read helpful articles about hearing care, hearing aids, and patient support."],
    bullets: [
      "Top Signs You May Need a Hearing Test",
      "How to Choose the Right Hearing Aid",
      "Rechargeable vs. Disposable Hearing Aids",
      "How Hearing Aid Fitting Improves Comfort",
      "Tips for Caring for Your Hearing Aids",
    ],
  },
  accessibility: {
    title: "Accessibility Commitment",
    image: "/images/editorial/accessible-hearing-technology-v2.webp",
    imageAlt: "An older Indian woman with a hearing aid using accessible phone controls with family support",
    paragraphs: [
      "Audiosen is committed to making hearing care accessible for everyone.",
      `If you need any special accommodation, please call us at ${clinicContact.primaryCallDisplay} or WhatsApp ${clinicContact.whatsappDisplay} before your visit.`,
    ],
    bullets: [
      "Large-print materials on request",
      "Support for elderly or mobility-limited patients",
      "Friendly guidance for first-time visitors",
      "Home visit support when available",
    ],
  },
  sitemap: {
    title: "Sitemap",
    image: "/images/editorial/policy-trust-v2.webp",
    imageAlt: "Organized policy documents representing clear website navigation and trust",
    paragraphs: [
      "Audiosen website map and key pages for hearing care services, support, and policies.",
      "In-person location details are shared only after the team confirms the requested service and booking availability.",
    ],
    bullets: [
      "Home",
      "Hearing Aids Across India",
      "Browse All Hearing Aids",
      "Hearing Aid Types",
      "Hearing Aid Fitting & Aftercare",
      "Hearing Aid Repair in India",
      "Hearing Aid Cost Calculator",
      "About Us",
      "Careers",
      "Blog",
      "Editorial Policy",
      "Accessibility",
      "Hearing Aids in Dehradun",
      "Hearing Test in Dehradun",
      "Hearing Aid Repair in Dehradun",
      "Home Hearing Care in Dehradun",
      "Online Hearing Test",
      "Services",
      "Hearing Aid Brands",
      "Contact Audiosen",
      "Legal",
      "Privacy Policy",
      "Terms of Service",
      "Refund & Cancellation",
    ],
  },
  legal: {
    title: "Legal Information",
    image: "/images/editorial/policy-trust-v2.webp",
    imageAlt: "Clear policy documents with a privacy lock and hearing technology",
    paragraphs: [
      "Review status: staged on August 22, 2026; final owner and Indian legal approval is required before production launch.",
      "This page provides a central reference to Audiosen's privacy, website-use, and commercial guidance documents.",
      "A written quote, appointment confirmation, invoice, or service agreement may add transaction-specific terms. Nothing on these staged pages limits a right that cannot lawfully be excluded.",
    ],
    bullets: [
      "Privacy Policy: how we collect, use, and protect your data.",
      "Terms of Service: rules for using our website and services.",
      "Refund & Cancellation: appointment, service, and payment cancellation terms.",
      `For policy questions, contact ${clinicContact.email} or call ${clinicContact.primaryCallDisplay}.`,
    ],
  },
  privacyPolicy: {
    title: "Privacy Policy",
    image: "/images/editorial/policy-trust-v2.webp",
    imageAlt: "Privacy documents and a frosted lock representing protected information",
    paragraphs: [
      "Effective date: August 22, 2026.",
      "Audiosen values your privacy. This policy explains the personal data used by the public website enquiry and administration system. The website CRM coordinates requests and is not a clinical-record or hospital-record system.",
      "When you send an enquiry, Audiosen collects the details you choose to provide: name, phone or WhatsApp number, city, age group, requested service, consent record, source page and limited campaign attribution. Email, appointment preference, device context and additional message text are optional. Private repair photos or audiograms are accepted only through the protected upload workflow.",
      "Audiosen uses this information to answer and coordinate your request, send operational confirmations, maintain authorised follow-up records, prevent abuse, protect the service, meet applicable legal duties and understand whether an enquiry progressed. The team should not use this website CRM as a substitute for a clinical patient file.",
      "New enquiry records use Azure Database for PostgreSQL. Sensitive free text is encrypted, private attachments use random paths in non-public Azure Blob Storage and begin in quarantine, and outbound messages are queued in a transactional outbox for Azure Communication Services Email. The previous Azure Table lead source remains read-only only during an audited migration and retention window.",
      "Access to enquiries and private attachments is limited to allowlisted staff using authenticated, role-based administration. Administrative changes and sensitive reads are recorded in an audit trail. Application and security logs are structured to redact names, contact details, narratives, references, upload tokens and credentials.",
      "Optional Google Analytics stays off until you accept it. When enabled, Audiosen sends only fixed event names and identifiers such as page type, CTA location, brand slug or product slug. Query strings, names, phone numbers, emails, cities, age, finder answers, symptoms, hearing-test responses, enquiry references, messages and uploads are excluded. Advertising signals remain disabled.",
      "Audiosen does not sell personal data or use website health enquiries for targeted advertising. Necessary providers may process limited information for Azure hosting and storage, bot protection, authenticated administration, operational email or consented analytics. Information may also be disclosed when required to deliver an authorised service, investigate abuse, comply with applicable law or respond to a valid legal requirement.",
      "Default retention is: suspected spam for 30 days; unconverted website enquiries for 24 months after the last meaningful activity; private attachments for 90 days after closure and no longer than 12 months without documented need; delivered email-outbox bodies for 30 days; and raw Google Business snapshots for no more than 30 days. Legal minimums, active services, transactions, disputes, security investigations and documented holds may require a different period.",
      "For a patient under 18, a parent or lawful guardian must provide consent. A website checkbox is an initial declaration only; Audiosen must complete any legally required age and guardian verification before collecting expanded child information or delivering the applicable service. Do not upload a child's identity or clinical record through a general enquiry.",
      "You may request access, correction, withdrawal of contact consent, deletion, or grievance review for website enquiry data, subject to identity verification and applicable retention duties. Use support@audiosen.com from a verifiable contact channel. Withdrawing optional consent does not affect processing already lawfully completed, and Audiosen will stop consent-based contact that is no longer required.",
      "Audiosen applies technical and organisational safeguards, but no internet transmission or storage system can be guaranteed completely secure. Suspected privacy or security incidents should be reported promptly to support@audiosen.com.",
      "This implementation is designed for review against India's Digital Personal Data Protection Act, 2023 and the Digital Personal Data Protection Rules, 2025, including their notified commencement timetable. It is not a substitute for final Indian legal counsel and operational compliance review before production launch.",
    ],
    bullets: [
      "Required enquiry data: name, phone or WhatsApp, city, requested help and explicit contact/privacy consent.",
      "Optional data: email, age group, appointment preferences, device context, additional message text and limited campaign attribution.",
      "Private files: validated, quarantined, non-public and available only through short-lived authenticated access.",
      "Analytics: opt-in only, advertising disabled and no contact, health, finder, reference or query-string data.",
      "Children: parent or lawful-guardian consent and any required verification before expanded processing.",
      "Rights and grievance contact: support@audiosen.com.",
      "Official framework: https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa",
    ],
  },
  termsOfService: {
    title: "Terms of Service",
    image: "/images/editorial/policy-trust-v2.webp",
    imageAlt: "Organized service terms beside a pen and hearing technology",
    paragraphs: [
      "Review status: staged on August 22, 2026; final owner and Indian legal approval is required before production launch.",
      "These Terms of Service govern use of the Audiosen website and related online interactions. If you do not agree with these terms, please do not use this website.",
      "Website content is provided for general information and does not replace a clinical diagnosis, emergency care, or direct medical advice.",
      "Users agree to provide accurate information while submitting enquiries, appointment requests, or service details.",
      "A website enquiry does not reserve a product, appointment, trial, home visit, price, offer, warranty, or service. Audiosen confirms any applicable scope and commercial terms separately in writing.",
      "The website does not accept online payment. Any clinic or offline transaction proceeds only after written terms are supplied through an authorised Audiosen channel.",
      "Audiosen publishes original material and third-party material only under its recorded permission or source terms. Product media with unresolved commercial rights remains withheld.",
      "Links to third-party services are provided for convenience. Their availability and privacy practices are governed by their own terms, subject always to rights that cannot lawfully be excluded.",
      "These terms are governed by applicable laws of India. Any disputes are subject to competent jurisdiction as per applicable law.",
    ],
    bullets: [
      "Use the website lawfully and responsibly.",
      "Do not attempt unauthorized access, scraping, or service disruption.",
      "Clinical recommendations should be confirmed in a proper consultation.",
      "Policy updates may be posted on this page from time to time.",
    ],
  },
  refundCancellation: {
    title: "Cancellation & Commercial Terms",
    image: "/images/editorial/policy-trust-v2.webp",
    imageAlt: "Clear customer policy documents arranged in a trustworthy setting",
    paragraphs: [
      "Review status: staged on August 22, 2026; final owner and Indian legal approval is required before production launch.",
      "Audiosen does not publish a universal device, service, rental, trial, offer, return, deposit, warranty, or refund promise. The exact owner-approved written quote, appointment confirmation, invoice, manufacturer term, and service agreement supplied before an offline transaction control that transaction, together with applicable law.",
      "The website accepts enquiries only and does not take online payment. Sending a form does not create a purchase, reserve stock, or make a commercial program available.",
      "To cancel or reschedule a confirmed appointment, contact Audiosen as early as practical using the phone or support email in the confirmation. The team will respond using the written terms supplied for that booking.",
      "For an offline payment or device order, keep the written quote, invoice, exact model and serial details, included services, warranty, cancellation conditions, and any manufacturer terms. Audiosen will review a request against those records and rights under applicable law.",
      "Nothing on this staged page limits a consumer right that cannot lawfully be excluded.",
    ],
    bullets: [
      `Cancellation or commercial query: ${clinicContact.email} or call ${clinicContact.primaryCallDisplay}.`,
      "Share only the minimum booking or invoice details needed to locate the authorised record.",
      "Do not send payment-card information, banking credentials, or clinical documents by general email.",
    ],
  },
};
