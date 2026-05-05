import type {
  FeatureItem,
  HearingTestContent,
  HeroContent,
  InfoPageContent,
  ServiceItem,
  SubscriptionPlan,
} from "@/lib/types";

export const siteMeta = {
  title: "Audiosen | Hearing Care Services & Hearing Aid Solutions",
  description:
    "Audiosen provides hearing tests, hearing aid sales, fitting, repair, maintenance, and complete hearing care solutions with trusted brands and expert support.",
  keywords:
    "hearing care services, hearing aid sales, hearing tests, hearing aid fitting, hearing aid repair, hearing aid maintenance, audiologist in Dehradun, hearing solutions Dehradun, Phonak, Signia, Widex, ReSound",
  canonicalUrl: "https://audiosen.com/",
  ogImage: "https://audiosen.com/og-image.jpg",
  logo: "https://audiosen.com/audiosen-company-logo.png",
};

export const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://audiosen.com/#business",
  name: "Audiosen Hearing Care",
  alternateName: "Audiosen",
  url: "https://audiosen.com/",
  logo: siteMeta.logo,
  image: "https://audiosen.com/og-image.jpg",
  telephone: "+919311279270",
  email: "support@audiosen.com",
  priceRange: "₹₹",
  description: siteMeta.description,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Audiosen Hearing Care Clinic",
    addressLocality: "Dehradun",
    addressRegion: "Uttarakhand",
    postalCode: "248001",
    addressCountry: "IN",
  },
  areaServed: [
    "Dehradun",
    "Uttarakhand",
    "India",
  ],
  knowsAbout: [
    "Hearing tests",
    "Hearing aid fitting",
    "Hearing aid repair",
    "Phonak hearing aids",
    "Signia hearing aids",
    "Widex hearing aids",
    "ReSound hearing aids",
  ],
  sameAs: [
    "https://audiosen.com/",
  ],
};

export const navLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Online Test", href: "/hearing-test" },
  { label: "Solutions", href: "/#solutions" },
  { label: "Brands", href: "/#brands" },
  { label: "Rent", href: "/#rental" },
  { label: "Subscription", href: "/#subscription" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/#contact" },
];

export const heroContent: HeroContent = {
  title: "Complete Hearing Care Services & Hearing Aid Solutions.",
  subtitle:
    "We help people hear better with expert consultation, hearing tests, branded hearing aids, fitting, repair, and lifelong support.",
  ctaLabel: "Book Consultation →",
  ctaHref: "#contact",
  sideNote: "Service-first | sales + support + care",
};

export const hearingTestContent: HearingTestContent = {
  title: "Online Hearing Screening",
  subtitle: "An easy ear-by-ear tone check to help you decide when to book clinic diagnosis.",
  helper:
    "Use stereo headphones in a quiet room. Keep volume comfortable and answer honestly for each tone.",
  readyStatus: "Ready when you are. Use headphones and set your device volume to a comfortable level.",
  resultTitle: "Your Hearing Screening Report",
  disclaimer:
    "This online screening is not a medical diagnosis. Please book a clinic-based hearing evaluation for confirmed results and treatment advice.",
  checklist: [
    "Use headphones or earphones",
    "Sit in a quiet room",
    "Keep volume comfortable",
  ],
  steps: [
    "Wear stereo headphones and sit in a quiet room",
    "Run a quick sound check at comfortable volume",
    "Test each ear and answer each tone with Yes/No",
    "Review your report and confirm diagnosis at Audiosen Hearing Care Clinic",
  ],
  interpretationGuide: [
    "PTA (Pure Tone Average) is the average of key speech frequencies (500, 1000, 2000 Hz).",
    "Normal: up to 25 dB HL, Mild: 26-40 dB HL, Moderate: 41-60 dB HL, Severe: above 60 dB HL.",
    "Reliability explains confidence in your responses. Low reliability means you should re-test before interpretation.",
    "If you struggle in conversations, noisy places, or phone calls, book a full clinic evaluation even with a normal screen.",
  ],
  whoShouldNotRely: [
    "Children should use a clinic-based pediatric hearing evaluation instead of this online screening.",
    "Do not rely on this test if you have sudden hearing loss, ear pain, ear discharge, or active infection.",
    "If you have persistent severe tinnitus, dizziness, or one-sided sudden change, seek urgent medical care first.",
  ],
  reportNotes: [
    "Online results can vary depending on headphones, device volume, and room noise.",
    "A full audiology test is recommended if you notice difficulty with speech, calls, meetings, or background noise.",
  ],
};

export const providerHighlights = [
  {
    title: "Expert Consultation",
    description: "Personalized hearing care guidance based on your lifestyle, budget, and hearing needs.",
  },
  {
    title: "Trusted Hearing Aids",
    description: "We sell and support leading hearing aid brands for mild to profound hearing loss.",
  },
  {
    title: "Fitting & Repair",
    description: "Professional fitting, programming, cleaning, and repair for reliable daily use.",
  },
  {
    title: "After-Sales Care",
    description: "Follow-up support, maintenance, and long-term assistance after purchase.",
  },
];

export const solutionAreas = [
  {
    title: "Hearing Test & Screening",
    description: "Quick hearing checks and guidance to understand your hearing condition clearly.",
  },
  {
    title: "Hearing Aid Selection",
    description: "Choose the right style, technology, and brand for your hearing requirements.",
  },
  {
    title: "Senior Hearing Care",
    description: "Friendly support for older adults who need comfortable and dependable solutions.",
  },
  {
    title: "Family Hearing Support",
    description: "Care plans for children, adults, and families with long-term hearing needs.",
  },
];

export const services: ServiceItem[] = [
  {
    title: "Hearing Screening & Consultation",
    description:
      "First-level assessment to understand hearing concerns, lifestyle needs, and the right next step.",
    image: "/images/services/hearing-screening-consultation.jpg",
    imageAlt: "Audiologist consulting a patient about hearing care",
    points: [
      "Walk-in or appointment-based consultation",
      "Basic hearing concern discussion",
      "Personalized care recommendation",
    ],
  },
  {
    title: "Pure Tone Audiometry (PTA)",
    description:
      "Standard hearing test used to measure hearing levels across different sound frequencies.",
    image: "/images/services/pure-tone-audiometry.jpg",
    imageAlt: "Audiometry hearing test in a clinic",
    points: [
      "Air conduction testing",
      "Bone conduction testing",
      "Hearing threshold chart review",
    ],
  },
  {
    title: "Speech Audiometry",
    description:
      "Checks how well a person hears and understands speech in quiet and noisy conditions.",
    image: "/images/services/speech-audiometry.jpg",
    imageAlt: "Speech hearing assessment with audiologist",
    points: [
      "Speech recognition testing",
      "Word understanding assessment",
      "Conversation difficulty evaluation",
    ],
  },
  {
    title: "Impedance Audiometry / Tympanometry",
    description:
      "Evaluates middle ear function and helps identify ear pressure or eardrum issues.",
    image: "/images/services/tympanometry.jpg",
    imageAlt: "Tympanometry ear test equipment",
    points: [
      "Tympanogram testing",
      "Middle ear pressure check",
      "Eustachian tube function support",
    ],
  },
  {
    title: "OAE / Objective Hearing Tests",
    description:
      "Useful hearing assessment for babies, children, and cases where objective testing is needed.",
    image: "/images/services/oae-test.jpg",
    imageAlt: "Objective hearing test for child or infant",
    points: [
      "Otoacoustic emission testing",
      "Quick objective screening",
      "Helpful for pediatric hearing care",
    ],
  },
  {
    title: "Hearing Aid Trial & Selection",
    description:
      "Try different hearing aid styles and choose the best one based on hearing loss and comfort.",
    image: "/images/services/hearing-aid-trial.jpg",
    imageAlt: "Patient trying hearing aids with guidance",
    points: [
      "BTE, RIC, CIC, ITE, and rechargeable options",
      "Brand comparison and recommendation",
      "Comfort and sound quality trial",
    ],
  },
  {
    title: "Hearing Aid Fitting & Programming",
    description:
      "Professional fitting and tuning so the hearing aid matches the patient’s actual hearing needs.",
    image: "/images/services/fitting-programming.jpg",
    imageAlt: "Audiologist fitting and programming a hearing aid",
    points: [
      "Device fitting and adjustment",
      "Programming for speech clarity",
      "Real-ear support and follow-up tuning",
    ],
  },
  {
    title: "Hearing Aid Repair & Maintenance",
    description:
      "Regular servicing to keep hearing aids working properly for daily use.",
    image: "/images/services/repair-maintenance.jpg",
    imageAlt: "Hearing aid repair and maintenance service",
    points: [
      "Cleaning and inspection",
      "Wax guard and accessory support",
      "Battery and charging help",
    ],
  },
  {
    title: "Home Visit Hearing Services",
    description:
      "Hearing care support at home for elderly patients, busy families, or people with mobility issues.",
    image: "/images/services/home-visit.jpg",
    imageAlt: "Home visit hearing care consultation",
    points: [
      "Home hearing consultation",
      "Home hearing aid fitting support",
      "Home follow-up and servicing",
    ],
  },
  {
    title: "Pediatric & Senior Hearing Care",
    description:
      "Specialized support for children, adults, and older people who need different types of care.",
    image: "/images/services/pediatric-senior-care.jpg",
    imageAlt: "Child and senior hearing care support",
    points: [
      "Child-friendly hearing support",
      "Senior citizen hearing assistance",
      "Long-term follow-up care",
    ],
  },
  {
    title: "Tinnitus & Hearing Counseling",
    description:
      "Guidance and support for people experiencing ringing in the ears or communication difficulty.",
    image: "/images/services/tinnitus-counseling.jpg",
    imageAlt: "Hearing counseling session for tinnitus",
    points: [
      "Tinnitus awareness guidance",
      "Daily hearing care advice",
      "Communication and lifestyle support",
    ],
  },
  {
    title: "After-Sales Support",
    description:
      "Long-term support after purchase so the hearing solution remains comfortable and effective.",
    image: "/images/services/after-sales-support.jpg",
    imageAlt: "After sales hearing care support and follow up",
    points: [
      "Regular service checks",
      "Follow-up adjustments",
      "Patient support after fitting",
    ],
  },
];

export const facts = [
  "Fact 1: Hearing concerns can affect people of all ages, not only seniors.",
  "Fact 2: Early evaluation helps you choose the right hearing solution sooner.",
  "Fact 3: Modern hearing aids can be discreet, rechargeable, and highly comfortable.",
];

export const myths = [
  "Myth: Hearing aids are only for old age. Truth: Hearing support is useful at many stages of life.",
  "Myth: Buying a device is enough. Truth: Fitting, tuning, and follow-up care matter just as much.",
  "Myth: All devices are the same. Truth: Style, brand, and technology should match the person’s needs.",
];

export const whyNowPoints = [
  "Better communication with family and friends.",
  "Improved confidence in work and social settings.",
  "More comfort in meetings, calls, and daily conversations.",
  "Professional support before and after purchase.",
];

export const features: FeatureItem[] = [
  {
    title: "Personalized Recommendations",
    description: "Choose the right hearing solution based on hearing needs and daily routines.",
  },
  {
    title: "Multiple Hearing Aid Styles",
    description: "Access to discreet, rechargeable, and advanced hearing aid categories.",
  },
  {
    title: "Brand Support",
    description: "Trusted products from leading manufacturers with servicing support.",
  },
  {
    title: "Ongoing Care",
    description: "Help with fitting, follow-up, repair, and long-term maintenance.",
  },
];

export const brands = [
  {
    slug: "phonak",
    name: "Phonak",
    logo: "/brands/phonak.svg",
    summary: "Swiss precision with powerful speech clarity and universal connectivity.",
    position: "AI-powered speech clarity, rechargeable designs, and broad Bluetooth compatibility.",
    devices: [
      {
        title: "Audéo Infinio Ultra Sphere",
        badge: "AI flagship",
        image: "/images/products/phonak/audeo-sphere-infinio.png",
        imageAlt: "Phonak Audeo Infinio Ultra Sphere hearing aid",
        description:
          "Premium receiver-in-canal hearing aid with a dedicated AI chip for clearer speech in noise.",
        details: ["Spheric Speech Clarity 2.0", "Rechargeable RIC", "Universal Bluetooth"],
      },
      {
        title: "Audéo Infinio Ultra R",
        badge: "Rechargeable",
        image: "/images/products/phonak/audeo-infinio.png",
        imageAlt: "Phonak Audeo Infinio Ultra R hearing aid",
        description:
          "Everyday rechargeable RIC built for automatic listening comfort and smooth sound changes.",
        details: ["AutoSense OS", "Up to 31 hours battery", "Mild to profound fitting range"],
      },
      {
        title: "Virto R Infinio",
        badge: "Custom fit",
        image: "/images/products/phonak/virto-infinio.png",
        imageAlt: "Phonak Virto R Infinio custom hearing aid",
        description:
          "Rechargeable custom in-ear option for people who prefer a made-for-the-ear fit.",
        details: ["Custom in-ear design", "Rechargeable", "Universal connectivity"],
      },
      {
        title: "CROS Infinio",
        badge: "Single-sided",
        image: "/images/products/phonak/cros-infinio.png",
        imageAlt: "Phonak CROS Infinio hearing aid",
        description:
          "Wireless CROS solution designed to support people with unaidable hearing loss in one ear.",
        details: ["Single-sided hearing support", "Compatible with Infinio", "Wireless sound transfer"],
      },
      {
        title: "Naida Lumity",
        badge: "Power BTE",
        image: "/images/products/phonak/naida-lumity.png",
        imageAlt: "Phonak Naida Lumity power hearing aid",
        description:
          "Powerful behind-the-ear hearing aid for severe-to-profound hearing needs and demanding days.",
        details: ["Power fitting range", "Rechargeable option", "Speech in noise support"],
      },
      {
        title: "Sky Lumity",
        badge: "Pediatric",
        image: "/images/products/phonak/sky-lumity.png",
        imageAlt: "Phonak Sky Lumity pediatric hearing aid",
        description:
          "Child-focused hearing aid family built for school, play, speech access, and durable daily use.",
        details: ["Child-friendly design", "Roger compatibility", "Durable BTE style"],
      },
    ],
  },
  {
    slug: "signia",
    name: "Signia",
    logo: "/brands/signia.svg",
    summary: "Modern rechargeable hearing aids with conversation-focused performance.",
    position: "Integrated Xperience devices focused on group conversation, rechargeability, and app support.",
    devices: [
      {
        title: "Pure Charge&Go BCT IX",
        badge: "Bluetooth Classic",
        image: "/images/products/signia/pure-chargego-bct-ix.png",
        imageAlt: "Signia Pure Charge and Go BCT IX hearing aid",
        description:
          "Small rechargeable RIC with Bluetooth Classic support and long battery runtime.",
        details: ["36-hour runtime", "MFi, ASHA, LE Audio", "Portable charging"],
      },
      {
        title: "Pure Charge&Go IX",
        badge: "RIC",
        image: "/images/products/signia/pure-chargego-ix.png",
        imageAlt: "Signia Pure Charge and Go IX hearing aid",
        description:
          "Conversation-focused rechargeable RIC for busy social settings and everyday clarity.",
        details: ["RealTime Conversation Enhancement", "Rechargeable", "Signia Assistant"],
      },
      {
        title: "Silk Charge&Go IX",
        badge: "Invisible",
        image: "/images/products/signia/silk-chargego-ix.png",
        imageAlt: "Signia Silk Charge and Go IX in-canal hearing aid",
        description:
          "Nearly invisible rechargeable in-canal hearing aid with ready-to-wear comfort.",
        details: ["Rechargeable CIC style", "Discreet fit", "Conversation support"],
      },
      {
        title: "Active Pro IX",
        badge: "Earbud style",
        image: "/images/products/signia/active-pro-ix.png",
        imageAlt: "Signia Active Pro IX hearing aid earbuds",
        description:
          "Prescription hearing aid in an earbud-style design for people who want a familiar look.",
        details: ["Earbud design", "Rechargeable case", "Group conversation focus"],
      },
      {
        title: "Styletto IX",
        badge: "Slim design",
        image: "/images/products/signia/styletto-ix.png",
        imageAlt: "Signia Styletto IX hearing aid",
        description:
          "Slim rechargeable style with IX conversation support and a pocket-friendly charging case.",
        details: ["Integrated Xperience", "Slim receiver-in-canal", "Portable charging"],
      },
      {
        title: "Motion Charge&Go IX",
        badge: "BTE",
        image: "/images/products/signia/motion-chargego-ix.png",
        imageAlt: "Signia Motion Charge and Go IX hearing aid",
        description:
          "Behind-the-ear IX option for users who need more fitting power with rechargeable comfort.",
        details: ["Rechargeable BTE", "Conversation support", "Comfortable all-day fit"],
      },
    ],
  },
  {
    slug: "widex",
    name: "Widex",
    logo: "/brands/widex.svg",
    summary: "Natural sound quality and comfort-focused hearing solutions.",
    position: "Natural sound, Allure platform choices, and discreet rechargeable options.",
    devices: [
      {
        title: "Allure RIC R D",
        badge: "Newest platform",
        image: "/images/products/widex/allure-ric-r-d.webp",
        imageAlt: "Widex Allure RIC R D hearing aid",
        description:
          "Receiver-in-canal Allure model built on Widex's newest platform for natural speech clarity.",
        details: ["W1 chip", "Allure PureSound", "Rechargeable RIC"],
      },
      {
        title: "Allure BTE R D",
        badge: "BTE power",
        image: "/images/products/widex/allure-bte-r-d.webp",
        imageAlt: "Widex Allure BTE R D hearing aid",
        description:
          "Behind-the-ear Allure option for people needing a durable style and broad fitting support.",
        details: ["Mild to profound support", "Rechargeable BTE", "Allure sound platform"],
      },
      {
        title: "Allure ITE R D",
        badge: "In-ear",
        image: "/images/products/widex/allure-ite-r-d.webp",
        imageAlt: "Widex Allure ITE R D hearing aid",
        description:
          "Rechargeable in-the-ear Allure model with app control and hands-free connectivity.",
        details: ["In-the-ear fit", "Hands-free Bluetooth", "Intuitive charger"],
      },
      {
        title: "SmartRIC",
        badge: "All-day design",
        image: "/images/products/official/widex-smartric.jpg",
        imageAlt: "Widex SmartRIC hearing aid",
        description:
          "Slim L-shaped RIC designed for all-day battery life and better microphone placement.",
        details: ["Up to 37 hours battery", "Portable charger", "Wind-noise comfort"],
      },
      {
        title: "Moment Sheer",
        badge: "Natural sound",
        image: "/images/products/official/widex-moment.png",
        imageAlt: "Widex Moment hearing aid",
        description:
          "Discreet Widex option known for natural sound processing and everyday listening comfort.",
        details: ["PureSound processing", "Rechargeable styles", "App personalization"],
      },
      {
        title: "Widex Beyond",
        badge: "Connected",
        image: "/images/products/official/widex-beyond.jpg",
        imageAlt: "Widex Beyond hearing aid",
        description:
          "Connected hearing aid option with Widex sound quality and smartphone control support.",
        details: ["Smartphone app control", "Streaming support", "Comfort-focused fitting"],
      },
    ],
  },
  {
    slug: "resound",
    name: "ReSound",
    logo: "/brands/resound.svg",
    summary: "AI hearing support with smart connectivity and streaming.",
    position: "AI-enhanced listening, Auracast-ready connectivity, and near-invisible styles.",
    devices: [
      {
        title: "ReSound Vivia",
        badge: "AI flagship",
        image: "/images/products/resound/vivia-black.png",
        imageAlt: "ReSound Vivia hearing aids",
        description:
          "AI hearing aid focused on vivid sound, hearing in noise, and natural listening control.",
        details: ["Intelligence Augmented", "Bluetooth LE Audio", "Auracast Assistant"],
      },
      {
        title: "ReSound Savi",
        badge: "Connected",
        image: "/images/products/resound/savi-sand.png",
        imageAlt: "ReSound Savi hearing aids",
        description:
          "Small, comfortable hearing aid line built for clear sound and strong connectivity.",
        details: ["Bluetooth LE Audio", "Auracast support", "Rechargeable or battery styles"],
      },
      {
        title: "ReSound Nexia",
        badge: "Auracast",
        image: "/images/products/official/resound-nexia.png",
        imageAlt: "ReSound Nexia hearing aid",
        description:
          "Award-winning hearing aid family with Auracast support and multiple style options.",
        details: ["Micro RIE, RIE, BTE, custom", "Made for Auracast", "Streaming support"],
      },
      {
        title: "ReSound OMNIA",
        badge: "Noise focus",
        image: "/images/products/official/resound-omnia.png",
        imageAlt: "ReSound OMNIA hearing aid",
        description:
          "Premium ReSound hearing aid built for stronger hearing in noise and natural sound access.",
        details: ["Front Focus", "Rechargeable options", "Smart 3D app support"],
      },
      {
        title: "ReSound Key",
        badge: "Essential",
        image: "/images/products/official/resound-key.png",
        imageAlt: "ReSound Key hearing aid",
        description:
          "Reliable essential hearing aid line for practical daily clarity and comfortable fitting.",
        details: ["Essential daily support", "Multiple styles", "Wireless accessory support"],
      },
      {
        title: "ReSound Vivia RIE",
        badge: "Rechargeable",
        image: "/images/products/resound/vivia-grey.png",
        imageAlt: "ReSound Vivia RIE hearing aids with charger",
        description:
          "Rechargeable RIE version of Vivia with AI-assisted listening and modern streaming support.",
        details: ["Rechargeable RIE", "AI noise handling", "Bluetooth LE Audio"],
      },
    ],
  },
];

export const rentalPlans = [
  {
    title: "Basic Hearing Aid Rental",
    price: "₹3,499 / month",
    deposit: "₹6,999 refundable deposit",
    minPeriod: "Minimum 30 days",
    bestFor: "First-time users, temporary support, mild hearing needs",
    includes: [
      "One hearing aid device",
      "Initial fitting guidance",
      "One follow-up adjustment",
      "Basic cleaning kit",
    ],
  },
  {
    title: "Mid-Range Hearing Aid Rental",
    price: "₹5,999 / month",
    deposit: "₹11,999 refundable deposit",
    minPeriod: "Minimum 30 days",
    bestFor: "Regular daily use, better sound clarity, rechargeable options",
    includes: [
      "One branded hearing aid device",
      "Fitting and programming support",
      "One follow-up service visit",
      "Cleaning and maintenance support",
    ],
  },
  {
    title: "Premium Hearing Aid Rental",
    price: "₹9,999 / month",
    deposit: "₹19,999 refundable deposit",
    minPeriod: "Minimum 90 days",
    bestFor: "AI hearing aids, rechargeable models, strong speech support",
    includes: [
      "Premium hearing aid device",
      "Professional fitting",
      "Priority service support",
      "One replacement check if needed",
    ],
  },
];

export const rentalTerms = [
  "Valid government ID and address proof are required before rental approval.",
  "Rental is approved only after hearing assessment and device suitability check.",
  "Minimum rental period is 30 days for basic and mid-range devices; 90 days for premium devices.",
  "Security deposit is refundable only after device return and full inspection.",
  "Late return charges will apply after the agreed rental end date.",
  "Damage, tampering, water damage, or loss will be charged at full replacement cost.",
  "Only normal wear and tear is accepted; missing accessories are charged separately.",
  "Customer must not open, modify, repair, or hand over the device to a third party.",
  "Rental includes initial fitting and one standard follow-up adjustment.",
  "Consumables such as wax guards, domes, tubes, batteries, and chargers may be chargeable separately.",
  "The company may replace a device with a similar model if servicing is required.",
  "Final approval for rental remains with the company after inspection and stock availability.",
  "No refund is provided for partially used rental periods.",
  "The customer is responsible for safe storage, handling, and daily care of the device.",
  "Any service visit outside the included plan may be billed separately.",
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "three_month",
    label: "3 Months Care Plan",
    priceInr: 2999,
    badge: "Entry",
    coverage: [
      "1 hearing screening / consultation",
      "1 device fitting review",
      "1 cleaning / maintenance visit",
      "WhatsApp support for plan duration",
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
    badge: "Best Value",
    coverage: [
      "2 hearing screenings / consultations",
      "4 tuning / re-programming sessions",
      "4 cleaning / maintenance visits",
      "Priority repair support",
      "Accessory discount support",
    ],
  },
];

export const footerContact = {
  company: "Audiosen Hearing Care",
  copyright: "Copyright 2026 - Better hearing, better living",
  location: "Audiosen Hearing Care Clinic, Dehradun, Uttarakhand 248001, India",
  phone: "+91 8383993592, (+91 9311279270 whatsapp support only)",
  gmail: "support@audiosen.com",
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
    paragraphs: [
      "Audiosen is a service-based hearing care company focused on helping people hear better through consultation, hearing tests, branded hearing aid sales, fitting, repair, and ongoing support.",
      "Our team provides practical hearing solutions for children, adults, and seniors with a patient-first approach and clear guidance.",
      "Our mission: to make hearing care simple, trustworthy, and accessible for every person who needs support.",
    ],
  },
  careers: {
    title: "Join the Audiosen Team",
    paragraphs: [
      "We are looking for hearing care professionals, patient coordinators, and support team members.",
      "Send your CV to careersaudiosen@gmail.com with the subject line \"Application - [Position Name]\".",
    ],
    bullets: [
      "Clinical Audiologist - Full time, patient care and fitting support.",
      "Hearing Aid Technician - Repair, maintenance, and servicing work.",
      "Patient Counselor - Friendly communication and follow-up support.",
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
    paragraphs: [
      "Audiosen is committed to making hearing care accessible for everyone.",
      "If you need any special accommodation, please call us at +91 8383993592, (+91 9311279270 - whatsapp support only) before your visit.",
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
    paragraphs: [
      "Audiosen website map and key pages for hearing care services, support, and policies.",
      "Address: Audiosen, Dehradun, Uttarakhand 248001, India.",
    ],
    bullets: [
      "Home",
      "About Us",
      "Careers",
      "Blog",
      "Accessibility",
      "Online Hearing Test",
      "Services",
      "Hearing Aid Brands",
      "Our Experts",
      "Contact & Location",
      "Legal",
      "Privacy Policy",
      "Terms of Service",
      "Refund & Cancellation",
    ],
  },
  legal: {
    title: "Legal Information",
    paragraphs: [
      "Effective date: May 1, 2026.",
      "This page provides a central reference to Audiosen's legal, privacy, and customer policy documents. These policies apply to visitors, customers, and users of our website and related digital services.",
      "By using our website, booking services, or submitting enquiries, you agree to the applicable terms listed below.",
    ],
    bullets: [
      "Privacy Policy: how we collect, use, and protect your data.",
      "Terms of Service: rules for using our website and services.",
      "Refund & Cancellation: appointment, service, and payment cancellation terms.",
      "For policy questions, contact support@audiosen.com or +91 8383993592, (+91 9311279270 - whatsapp support only).",
    ],
  },
  privacyPolicy: {
    title: "Privacy Policy",
    paragraphs: [
      "Effective date: May 1, 2026.",
      "Audiosen values your privacy. This Privacy Policy explains what information we collect through our website, how we use it, and the choices available to you.",
      "When you submit a contact or enquiry form, we may collect details such as your name, phone number, email address, city, hearing concern, and message content.",
      "We use this information to respond to enquiries, provide hearing care guidance, schedule appointments, improve service quality, and maintain support records.",
      "We do not sell your personal information. We may share information only with trusted service providers involved in website hosting, email delivery, payment processing, or lawful compliance requirements.",
      "We apply reasonable technical and administrative safeguards to protect information, but no internet transmission or storage system can be guaranteed 100% secure.",
      "You may request correction or deletion of your data, subject to legal and operational requirements. To request this, contact support@audiosen.com.",
      "By using this website, you consent to this Privacy Policy and related processing for legitimate service purposes.",
    ],
    bullets: [
      "Data collected: contact details, enquiry details, and basic usage diagnostics.",
      "Data use: customer communication, service delivery, operations, and compliance.",
      "Data retention: kept only as long as reasonably required for support and legal needs.",
      "Contact for privacy concerns: support@audiosen.com.",
    ],
  },
  termsOfService: {
    title: "Terms of Service",
    paragraphs: [
      "Effective date: May 1, 2026.",
      "These Terms of Service govern use of the Audiosen website and related online interactions. If you do not agree with these terms, please do not use this website.",
      "Website content is provided for general information and does not replace a clinical diagnosis, emergency care, or direct medical advice.",
      "Users agree to provide accurate information while submitting enquiries, appointment requests, or service details.",
      "Audiosen may update website content, prices, product availability, and service scope without prior notice.",
      "All logos, designs, written content, and media on this site are owned by or licensed to Audiosen and must not be copied or reused without permission.",
      "Audiosen is not liable for losses arising from third-party websites, network interruptions, external payment issues, or misuse of user credentials.",
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
    title: "Refund & Cancellation Policy",
    paragraphs: [
      "Effective date: May 1, 2026.",
      "This policy applies to online and offline bookings, hearing care consultations, device services, and plan payments made to Audiosen.",
      "Appointment cancellation requests should be shared as early as possible through phone or email. Timely rescheduling requests are generally accommodated subject to slot availability.",
      "If Audiosen cancels a confirmed appointment due to operational constraints, customers may choose a rescheduled slot or applicable refund for the affected service fee.",
      "Refund eligibility depends on service type, device category, payment channel, and whether the service has already been delivered or consumed.",
      "For hearing aid device purchases, trials, rentals, consumables, and custom-fit products, return and refund outcomes are subject to product condition, hygiene handling, manufacturer terms, and documented service scope.",
      "Approved refunds are processed back to the original payment method where possible, and processing timelines may vary by bank or payment provider.",
      "Non-refundable items may include completed consultations, already-rendered service sessions, used consumables, damaged products, and partially used plan durations unless otherwise committed in writing.",
    ],
    bullets: [
      "To request cancellation/refund: support@audiosen.com or +91 8383993592,+91 9311279270.",
      "Share booking ID, payment reference, and reason for request for faster processing.",
      "Refund decisions are based on service records and applicable policy terms.",
      "Rental and subscription plans also remain subject to their specific signed terms.",
    ],
  },
};

export const contactContent = {
  sectionTitle: "Book Your Hearing Care Consultation",
  sectionSubtitle:
    "Tell us your hearing concern, product need, or service request and our team will guide you.",
  lockline:
    "We’ll reply within 24 hours and help you choose the right next step.",
  submitLabel: "Send Enquiry",
  successLabel:
    "Your enquiry has been sent. We will contact you soon with next steps.",
};

export const featureMarks = ["CARE", "FIT", "SUPPORT", "SERVICE"];

export const serviceJourney = [
  {
    title: "Consultation",
    description: "We learn about your hearing concern, lifestyle, and budget.",
  },
  {
    title: "Evaluation",
    description: "We guide you toward the right hearing test or screening step.",
  },
  {
    title: "Recommendation",
    description: "We suggest the right hearing aid style or service plan.",
  },
  {
    title: "Support",
    description: "We fit, service, and support your hearing solution over time.",
  },
];
