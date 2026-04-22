export type AdLandingPage = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  image: string;
  imageAlt: string;
  proofPoints: string[];
  services: string[];
  process: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  keywords: string[];
};

export const adLandingPages = {
  "hearing-aids-dehradun": {
    slug: "hearing-aids-dehradun",
    title: "Hearing Aids in Dehradun",
    metaTitle: "Hearing Aids in Dehradun | Audiosen Hearing Care",
    metaDescription:
      "Explore hearing aids in Dehradun with Audiosen. Get brand guidance, fitting support, trial options, repair, and aftercare from a local hearing care team.",
    eyebrow: "Hearing Aid Consultation in Dehradun",
    headline: "Find the right hearing aid with local expert guidance.",
    subheadline:
      "Audiosen helps you compare trusted hearing aid brands, understand styles, try suitable options, and get professional fitting and aftercare in Dehradun.",
    primaryCta: "Book Hearing Aid Consultation",
    image: "/images/products/phonak/audeo-sphere-infinio.png",
    imageAlt: "Premium rechargeable hearing aid available through Audiosen",
    proofPoints: [
      "Trusted brands including Phonak, Signia, Widex, and ReSound",
      "Rechargeable, discreet, RIC, BTE, CIC, and custom-fit choices",
      "Fitting, programming, repair, and follow-up support available",
    ],
    services: [
      "Hearing aid selection based on lifestyle and budget",
      "Device trial and comfort guidance",
      "Professional fitting and sound programming",
      "Cleaning, servicing, accessories, and maintenance support",
    ],
    process: [
      "Share your hearing concern and daily listening needs.",
      "Get a hearing screening or audiology recommendation.",
      "Compare suitable devices and fitting options.",
      "Book fitting, follow-up, repair, or aftercare support.",
    ],
    faqs: [
      {
        question: "Which hearing aid brand is best?",
        answer:
          "The best option depends on hearing needs, comfort, budget, connectivity, and style. Audiosen helps compare suitable brands instead of pushing one model.",
      },
      {
        question: "Can I try hearing aids before deciding?",
        answer:
          "Trial availability depends on device category and stock. Our team can guide you on current options during consultation.",
      },
    ],
    keywords: [
      "hearing aids dehradun",
      "hearing aid shop near me",
      "best hearing aids in dehradun",
      "phonak hearing aid dehradun",
    ],
  },
  "hearing-test-dehradun": {
    slug: "hearing-test-dehradun",
    title: "Hearing Test in Dehradun",
    metaTitle: "Hearing Test in Dehradun | Audiosen Hearing Care",
    metaDescription:
      "Book a hearing test or screening in Dehradun with Audiosen. Get clear guidance for hearing concerns, audiology support, and next-step recommendations.",
    eyebrow: "Hearing Screening & Audiology Guidance",
    headline: "Book a clear, comfortable hearing check in Dehradun.",
    subheadline:
      "If conversations, calls, meetings, or background noise feel harder than before, Audiosen can guide you with hearing screening and next-step support.",
    primaryCta: "Book Hearing Test",
    image: "/images/contact-audiologist-doctor.jpg",
    imageAlt: "Audiologist helping a patient during a hearing check",
    proofPoints: [
      "Friendly consultation for first-time visitors",
      "Online hearing screener plus clinic-based guidance",
      "Personalized next steps for hearing care and device support",
    ],
    services: [
      "Hearing screening and consultation",
      "Pure tone audiometry guidance",
      "Speech understanding discussion",
      "Audiogram explanation and recommendation",
    ],
    process: [
      "Tell us what situations are difficult to hear in.",
      "Complete screening or schedule a clinic evaluation.",
      "Review results with practical explanation.",
      "Choose follow-up care, hearing aids, or monitoring if needed.",
    ],
    faqs: [
      {
        question: "Is the online hearing screener a diagnosis?",
        answer:
          "No. Online screening is only a helpful first step. A clinic-based hearing evaluation is recommended for confirmed results and treatment advice.",
      },
      {
        question: "How long does a hearing check take?",
        answer:
          "A basic consultation is usually quick, while full audiology testing may take longer depending on the assessment required.",
      },
    ],
    keywords: [
      "hearing test dehradun",
      "hearing test near me",
      "audiologist in dehradun",
      "free hearing test",
    ],
  },
  "hearing-aid-rental": {
    slug: "hearing-aid-rental",
    title: "Hearing Aid Rental",
    metaTitle: "Hearing Aid Rental | Audiosen Hearing Care",
    metaDescription:
      "Ask Audiosen about hearing aid rental plans with fitting support, maintenance guidance, clear terms, and local assistance in Dehradun.",
    eyebrow: "Flexible Hearing Aid Rental Plans",
    headline: "Try suitable hearing support with rental options.",
    subheadline:
      "Audiosen offers rental guidance for eligible hearing aid users after assessment, with fitting support, service help, and clear rental terms.",
    primaryCta: "Ask About Rental Plans",
    image: "/images/services/hearing-aid-trial.jpg",
    imageAlt: "Patient trying a hearing aid with support from an audiologist",
    proofPoints: [
      "Plans starting from Rs 3,499 per month",
      "Fitting guidance and follow-up support available",
      "Rental approval after suitability check and KYC",
    ],
    services: [
      "Basic, mid-range, and premium rental categories",
      "Initial fitting and usage guidance",
      "Follow-up adjustment and service support",
      "Clear security deposit and return terms",
    ],
    process: [
      "Book a hearing consultation first.",
      "Confirm device suitability and rental category.",
      "Complete KYC, deposit, and rental approval.",
      "Use the device with fitting and support guidance.",
    ],
    faqs: [
      {
        question: "Can anyone rent a hearing aid?",
        answer:
          "Rental is approved only after hearing assessment, device suitability check, KYC, and stock availability.",
      },
      {
        question: "Is the security deposit refundable?",
        answer:
          "Yes, the deposit is refundable after device return and inspection, subject to rental terms and device condition.",
      },
    ],
    keywords: [
      "hearing aid rental",
      "hearing aid on rent",
      "rent hearing aid dehradun",
      "hearing aid monthly plan",
    ],
  },
  "hearing-aid-repair-dehradun": {
    slug: "hearing-aid-repair-dehradun",
    title: "Hearing Aid Repair in Dehradun",
    metaTitle: "Hearing Aid Repair in Dehradun | Audiosen Hearing Care",
    metaDescription:
      "Need hearing aid cleaning, service, repair, battery, charger, or fitting help in Dehradun? Contact Audiosen for hearing aid maintenance support.",
    eyebrow: "Hearing Aid Service & Maintenance",
    headline: "Keep your hearing aids working comfortably every day.",
    subheadline:
      "Audiosen supports hearing aid users with cleaning, inspection, fitting checks, repair guidance, accessories, and maintenance help in Dehradun.",
    primaryCta: "Book Repair or Service",
    image: "/images/products/official/signia-charge-and-go-ix.jpg",
    imageAlt: "Rechargeable hearing aid product for service and maintenance support",
    proofPoints: [
      "Cleaning, inspection, and basic troubleshooting",
      "Battery, charger, wax guard, dome, and accessory guidance",
      "Fitting review and follow-up tuning support",
    ],
    services: [
      "Hearing aid cleaning and inspection",
      "Charging and battery issue guidance",
      "Wax guard, dome, tube, and accessory support",
      "Fitting comfort and programming review",
    ],
    process: [
      "Share your device issue and brand/model if available.",
      "Visit or book a service consultation.",
      "Get cleaning, inspection, or repair guidance.",
      "Schedule follow-up if tuning or parts are required.",
    ],
    faqs: [
      {
        question: "Can Audiosen repair every hearing aid?",
        answer:
          "Support depends on the brand, model, issue, parts availability, and warranty status. Our team can inspect and guide the next step.",
      },
      {
        question: "What common issues can be checked?",
        answer:
          "Common checks include low sound, no sound, blocked wax guards, battery or charging trouble, feedback, comfort issues, and accessory problems.",
      },
    ],
    keywords: [
      "hearing aid repair dehradun",
      "hearing aid service near me",
      "hearing aid maintenance",
      "hearing aid battery dehradun",
    ],
  },
} satisfies Record<string, AdLandingPage>;

export const adLandingPageList = Object.values(adLandingPages);
