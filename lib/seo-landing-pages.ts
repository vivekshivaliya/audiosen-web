export interface SeoLandingItem {
  title: string;
  description: string;
}

export interface SeoLandingSection {
  eyebrow: string;
  heading: string;
  introduction?: string;
  items: readonly SeoLandingItem[];
  numbered?: boolean;
}

export interface SeoLandingPageContent {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  introduction: string;
  image: string;
  imageAlt: string;
  chips: readonly string[];
  notice: string;
  sections: readonly SeoLandingSection[];
  faqs: readonly { question: string; answer: string }[];
  sources?: readonly { label: string; href: string }[];
  relatedLinks: readonly { label: string; href: string }[];
  closingTitle: string;
  closingDescription: string;
}

export const seoLandingPages = {
  pricesIndia: {
    slug: "hearing-aid-prices-india",
    metaTitle: "Hearing Aid Prices in India | Cost Guide | Audiosen",
    metaDescription:
      "Understand what shapes hearing-aid prices in India, compare written quotes, and plan device, fitting, warranty, and aftercare costs with Audiosen.",
    eyebrow: "Transparent cost planning across India",
    title: "Hearing Aid Prices in India: A Clear Cost Guide",
    introduction:
      "A useful hearing-aid quote should identify the exact model and explain what you are paying for beyond the device. Audiosen helps people across India compare written costs without presenting a generic online price as a personal recommendation.",
    image: "/images/editorial/hearing-aid-guidance-v2.webp",
    imageAlt: "A hearing-care professional explaining hearing-aid options to an Indian family",
    chips: ["Written quotes", "Model-level comparison", "India-wide enquiries"],
    notice:
      "Audiosen does not publish an unverified universal price list. Model availability, MRP basis, campaign price, fitting, warranty, stock, taxes, delivery, and aftercare must be confirmed in your written quote before payment.",
    sections: [
      {
        eyebrow: "What changes the total",
        heading: "A hearing aid is more than its shelf price",
        introduction:
          "Two quotes can look similar while including very different services. Compare the complete package on the same basis.",
        items: [
          {
            title: "Device and technology level",
            description:
              "The exact make, model, style, features, quantity, and left or right configuration should appear on the quote.",
          },
          {
            title: "Assessment and fitting",
            description:
              "Ask whether assessment, ear impressions when required, programming, verification, and initial fitting are included or billed separately.",
          },
          {
            title: "Follow-up and aftercare",
            description:
              "Confirm the number or period of follow-up adjustments, cleaning support, remote assistance, and any charge after the included period.",
          },
          {
            title: "Warranty and accessories",
            description:
              "Check manufacturer warranty, loss or damage exclusions, charger, batteries, earmoulds, receivers, domes, wax guards, and connectivity accessories.",
          },
        ],
      },
      {
        eyebrow: "Quote checklist",
        heading: "Compare every proposal line by line",
        items: [
          {
            title: "1. Identify the product",
            description:
              "Record the manufacturer, full model name, technology level, style, serial-number timing, and quantity.",
          },
          {
            title: "2. Separate MRP and campaign price",
            description:
              "Ask for the MRP basis, actual payable price, taxes, discount conditions, quote validity, and stock confirmation in writing.",
          },
          {
            title: "3. List professional services",
            description:
              "Make assessment, fitting, programming, verification, counselling, follow-up, and home-visit charges explicit.",
          },
          {
            title: "4. Check ownership costs",
            description:
              "Plan for consumables, accessories, batteries or charging, repairs outside warranty, travel, and optional extended support.",
          },
        ],
        numbered: true,
      },
    ],
    faqs: [
      {
        question: "Why does Audiosen ask me to request a quote?",
        answer:
          "A model-specific written quote can show the actual device, service package, stock, warranty, fitting, and time-limited terms. A generic number cannot reliably communicate those details.",
      },
      {
        question: "Is the lowest hearing-aid price always the lowest total cost?",
        answer:
          "Not necessarily. Compare what is included for fitting, follow-up, accessories, warranty, repairs, and aftercare before deciding.",
      },
      {
        question: "Can Audiosen help people outside Dehradun compare prices?",
        answer:
          "Yes. Audiosen accepts enquiries across India and can provide guidance and location-based coordination. In-person location and availability are confirmed directly before booking.",
      },
      {
        question: "Does an online price confirm that a device is suitable for me?",
        answer:
          "No. Price alone does not establish suitability. Device selection and programming should be based on the appropriate hearing assessment and professional guidance.",
      },
    ],
    relatedLinks: [
      { label: "Compare hearing-aid types", href: "/hearing-aid-types" },
      { label: "Plan total cost", href: "/tools/hearing-aid-cost-calculator" },
      { label: "Hearing aids across India", href: "/hearing-aids-india" },
    ],
    closingTitle: "Request a model-specific written quote",
    closingDescription:
      "Tell Audiosen your city, current hearing reports if available, and what you need help comparing. The team can explain the available next step without treating an online price as a clinical recommendation.",
  },
  types: {
    slug: "hearing-aid-types",
    metaTitle: "Types of Hearing Aids | Styles & Features | Audiosen",
    metaDescription:
      "Compare RIC, BTE, ITE, CIC, power, CROS, rechargeable, and pediatric hearing-aid styles, then request assessment-led guidance from Audiosen.",
    eyebrow: "A practical style comparison",
    title: "Types of Hearing Aids: Styles, Features, and Questions to Ask",
    introduction:
      "Hearing aids come in different physical styles and technology configurations. The right shortlist depends on hearing results, ear health, listening needs, comfort, handling, connectivity, and the support available after fitting.",
    image: "/images/editorial/modern-hearing-technology-v2.webp",
    imageAlt: "Modern hearing-aid technology arranged for a clear product comparison",
    chips: ["RIC and BTE", "In-ear styles", "Assessment-led selection"],
    notice:
      "This guide explains common categories, not personal suitability. Do not choose or adjust a hearing aid from style descriptions alone; arrange an appropriate assessment and qualified fitting.",
    sections: [
      {
        eyebrow: "Common styles",
        heading: "Start with how each device is worn",
        items: [
          {
            title: "Receiver-in-canal (RIC/RIE)",
            description:
              "A small case sits behind the ear and connects to a receiver in the ear canal. Ask about receiver strength, dome or mould choice, charging, phone compatibility, and moisture care.",
          },
          {
            title: "Behind-the-ear (BTE)",
            description:
              "The main device sits behind the ear and connects through tubing or a hook. Compare size, power options, earmoulds, controls, batteries or charging, and maintenance.",
          },
          {
            title: "In-the-ear (ITE) and in-the-canal (ITC)",
            description:
              "Custom devices sit within the outer ear or canal. Ask about ear impressions, controls, battery or charging options, repair handling, and whether the style fits your needs.",
          },
          {
            title: "Completely-in-canal (CIC/IIC)",
            description:
              "Smaller custom styles sit deeper in the canal. Discretion can involve trade-offs in controls, handling, connectivity, battery size, and serviceability.",
          },
          {
            title: "Power and super-power options",
            description:
              "Some BTE or RIC configurations are designed for higher output. Output needs must be determined from hearing results and fitted with appropriate safeguards.",
          },
          {
            title: "CROS and BiCROS systems",
            description:
              "These systems route sound from one side to the other in specific one-sided hearing situations. They require assessment-led evaluation rather than self-selection.",
          },
          {
            title: "Pediatric configurations",
            description:
              "Children need age-appropriate assessment, fitting, retention, safety, verification, family guidance, and regular review as needs change.",
          },
          {
            title: "Rechargeable and connected devices",
            description:
              "Compare charger access, expected routine, compatible phones, streaming protocols, app controls, telecoil or accessory needs, and backup arrangements.",
          },
        ],
      },
      {
        eyebrow: "Decision framework",
        heading: "Questions that matter more than appearance",
        items: [
          {
            title: "What do my hearing results indicate?",
            description:
              "Bring a current assessment when available and ask how each shortlisted configuration relates to those results.",
          },
          {
            title: "Where do I struggle to listen?",
            description:
              "Discuss conversations, groups, work, calls, television, travel, outdoor use, and other real listening situations.",
          },
          {
            title: "Can I handle and maintain it?",
            description:
              "Consider vision, dexterity, charger access, insertion, controls, cleaning, consumables, and family or caregiver support.",
          },
          {
            title: "What happens after fitting?",
            description:
              "Confirm verification, adjustment visits, remote support, warranty, repairs, replacement parts, and the expected adaptation plan.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "Which hearing-aid type is best?",
        answer:
          "There is no single best style for everyone. The appropriate choice depends on hearing and ear assessment, communication needs, comfort, handling, features, budget, and follow-up support.",
      },
      {
        question: "Are smaller hearing aids always better?",
        answer:
          "No. A smaller style may affect controls, handling, battery or charging options, connectivity, output, and serviceability. Compare the complete trade-off.",
      },
      {
        question: "Can I buy one based only on an online sound check?",
        answer:
          "No. Audiosen's online sound check is an orientation tool, not calibrated audiometry or a diagnosis. Arrange an appropriate clinical assessment before selection and programming.",
      },
      {
        question: "Can Audiosen help me compare different brands?",
        answer:
          "Audiosen can discuss available styles and brands, subject to assessment, location, stock, service coverage, and written commercial terms.",
      },
    ],
    sources: [
      {
        label: "World Health Organization: World report on hearing",
        href: "https://www.who.int/publications/i/item/9789240020481",
      },
    ],
    relatedLinks: [
      { label: "Hearing-aid price guide", href: "/hearing-aid-prices-india" },
      { label: "Fitting and aftercare guide", href: "/hearing-aid-fitting-aftercare" },
      { label: "Online sound check", href: "/hearing-test" },
      { label: "Request guidance", href: "/contact" },
    ],
    closingTitle: "Build a shortlist around real listening needs",
    closingDescription:
      "Share your location, assessment reports if available, preferred style, daily listening situations, and handling needs. Audiosen can help you prepare the right questions for a qualified fitting pathway.",
  },
  fittingAftercare: {
    slug: "hearing-aid-fitting-aftercare",
    metaTitle: "Hearing Aid Fitting & Aftercare Guide | Audiosen",
    metaDescription:
      "Learn what to confirm during hearing-aid fitting, programming, follow-up, cleaning, warranty, and long-term aftercare across India.",
    eyebrow: "From first fit to long-term use",
    title: "Hearing Aid Fitting and Aftercare: What Good Support Includes",
    introduction:
      "A hearing aid needs more than a product handover. A clear fitting and aftercare plan should connect assessment, device setup, verification, realistic listening goals, maintenance, follow-up adjustments, and repair support.",
    image: "/images/editorial/hearing-test-consultation-v2.webp",
    imageAlt: "A hearing-care consultation with an Indian adult and a hearing device",
    chips: ["Fitting plan", "Follow-up adjustments", "Long-term care"],
    notice:
      "Exact fitting methods and follow-up frequency depend on the person's assessment, device, age, ear health, communication needs, and provider. Confirm the plan in writing before purchase.",
    sections: [
      {
        eyebrow: "The fitting journey",
        heading: "Six stages to discuss with your provider",
        items: [
          {
            title: "1. Confirm assessment and goals",
            description:
              "Review current hearing results, ear-health considerations, communication priorities, previous device experience, and situations you want to improve.",
          },
          {
            title: "2. Check the exact device",
            description:
              "Match the model, style, side, receiver or earmould, accessories, serial details, warranty, and written quote to what is supplied.",
          },
          {
            title: "3. Program and verify",
            description:
              "Ask how the provider will program and verify the fitting against the assessment and how comfort or safety concerns will be handled.",
          },
          {
            title: "4. Learn everyday use",
            description:
              "Practise insertion, removal, charging or battery changes, controls, app use, calls, cleaning, moisture care, and safe storage.",
          },
          {
            title: "5. Review real-life experience",
            description:
              "Keep notes about speech, noise, calls, comfort, feedback, loudness, handling, and daily wear so follow-up adjustments are specific.",
          },
          {
            title: "6. Maintain long-term support",
            description:
              "Know the follow-up schedule, consumables, cleaning route, repair process, loan-device policy if any, warranty exclusions, and charges after coverage ends.",
          },
        ],
        numbered: true,
      },
      {
        eyebrow: "Before you leave",
        heading: "Ask for a written aftercare record",
        items: [
          {
            title: "Device record",
            description:
              "Keep the invoice, model and serial details, side, accessories, charger, warranty document, and provider contact route together.",
          },
          {
            title: "Care instructions",
            description:
              "Use the manufacturer and provider instructions for cleaning, charging, batteries, wax protection, moisture, storage, and parts replacement.",
          },
          {
            title: "Follow-up entitlement",
            description:
              "Write down which adjustments are included, for how long, where they occur, whether remote support is available, and what later visits cost.",
          },
          {
            title: "Escalation route",
            description:
              "Know whom to contact for discomfort, unexpected sound, loss, physical damage, intermittent operation, or a change in hearing or ear symptoms.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "Should a hearing aid feel perfect on the first day?",
        answer:
          "Experiences vary. The important point is to receive clear use instructions and a follow-up route for comfort, sound, handling, and programming concerns rather than changing settings without guidance.",
      },
      {
        question: "What should I bring to a fitting?",
        answer:
          "Bring current hearing reports if available, relevant medical or referral information, the written quote, phones or accessories you want connected, and a family member if you want communication support.",
      },
      {
        question: "Is aftercare included in the device price?",
        answer:
          "It depends on the written package. Ask which visits, adjustments, cleaning, remote support, consumables, repairs, and warranty services are included and which are chargeable.",
      },
      {
        question: "Does Audiosen provide in-person fitting everywhere in India?",
        answer:
          "No nationwide in-person availability is implied. Audiosen accepts enquiries across India and confirms the available assessment, fitting, delivery, or support pathway and in-person location details before booking.",
      },
    ],
    sources: [
      {
        label: "World Health Organization: Primary ear and hearing care training manual",
        href: "https://www.who.int/publications/i/item/9789240060241",
      },
    ],
    relatedLinks: [
      { label: "Compare hearing-aid types", href: "/hearing-aid-types" },
      { label: "Hearing-aid repair guide", href: "/hearing-aid-repair-india" },
      { label: "Hearing aids across India", href: "/hearing-aids-india" },
      { label: "Contact Audiosen", href: "/contact" },
    ],
    closingTitle: "Plan aftercare before choosing a device",
    closingDescription:
      "Ask Audiosen to explain what fitting and follow-up can be coordinated for your location, then make sure every included service appears in your written quote.",
  },
  repairIndia: {
    slug: "hearing-aid-repair-india",
    metaTitle: "Hearing Aid Repair in India | Support Guide | Audiosen",
    metaDescription:
      "Get hearing-aid troubleshooting and repair coordination guidance across India, including warranty, shipping, estimates, data, and after-repair checks.",
    eyebrow: "Repair guidance and coordination",
    title: "Hearing Aid Repair in India: A Safer Service Path",
    introduction:
      "When a hearing aid stops working, first protect the device and record the problem. Audiosen can help people across India understand basic checks and coordinate an appropriate service route, subject to brand, location, warranty, parts, and provider availability.",
    image: "/images/editorial/accessible-hearing-technology-v2.webp",
    imageAlt: "A modern hearing device beside accessible support technology",
    chips: ["Warranty checks", "Written estimates", "Location-based coordination"],
    notice:
      "Do not open the casing, use unapproved liquids, apply heat, or attempt internal repairs. Follow the manufacturer instructions. If there is pain, discharge, injury, sudden hearing change, or a foreign object in the ear, seek qualified medical care rather than treating it as a device-repair problem.",
    sections: [
      {
        eyebrow: "Before sending a device",
        heading: "Record the fault and protect your information",
        items: [
          {
            title: "Describe the problem",
            description:
              "Note when it began, whether it is intermittent, which side is affected, recent moisture or impact, charging or battery behaviour, feedback, and app or accessory symptoms.",
          },
          {
            title: "Use only safe basic checks",
            description:
              "Follow the user manual for power, charging, battery orientation, visible blockage, replaceable wax protection, tubing, domes, and approved cleaning steps.",
          },
          {
            title: "Collect device records",
            description:
              "Find the invoice, model, serial number, purchase date, warranty document, previous repair history, charger, and accessories relevant to the fault.",
          },
          {
            title: "Back up app information",
            description:
              "Where the manufacturer app supports it, preserve account or pairing details and remove unnecessary personal information before handing over connected devices.",
          },
        ],
      },
      {
        eyebrow: "Repair workflow",
        heading: "Confirm the service terms before authorising work",
        items: [
          {
            title: "1. Intake confirmation",
            description:
              "Obtain a receipt describing the device, serial number, accessories handed over, visible condition, reported fault, and contact details.",
          },
          {
            title: "2. Warranty assessment",
            description:
              "Ask whether the reported fault appears covered, who makes the warranty decision, and which shipping, inspection, parts, or service charges may still apply.",
          },
          {
            title: "3. Written estimate",
            description:
              "For chargeable work, request diagnosis, parts, labour, taxes, delivery, estimate validity, expected timing, and approval threshold in writing.",
          },
          {
            title: "4. Return and checks",
            description:
              "Match the serial number, review work performed and repair warranty, test operation, reconnect accessories, and arrange programming or fitting checks when required.",
          },
        ],
        numbered: true,
      },
    ],
    faqs: [
      {
        question: "Can Audiosen repair every hearing-aid brand anywhere in India?",
        answer:
          "No universal coverage is claimed. Audiosen first confirms the brand, model, fault, location, warranty, parts, and available service route before accepting or coordinating a repair.",
      },
      {
        question: "Should I courier my hearing aid immediately?",
        answer:
          "Contact the service provider first. Confirm the receiving address, intake reference, packaging, insurance, accessories to include, shipping responsibility, and what happens if the device arrives damaged.",
      },
      {
        question: "Will repair change my hearing-aid settings?",
        answer:
          "Some service work may require a post-repair check or reprogramming. Ask how settings are preserved and whether fitting verification is needed before normal use resumes.",
      },
      {
        question: "When should I seek medical help instead of repair support?",
        answer:
          "Pain, discharge, bleeding, injury, a foreign object, severe dizziness, or a sudden or rapidly worsening hearing change should be assessed by an appropriate qualified medical professional.",
      },
    ],
    sources: [
      {
        label: "World Health Organization: Deafness and hearing loss",
        href: "https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss",
      },
    ],
    relatedLinks: [
      { label: "Fitting and aftercare", href: "/hearing-aid-fitting-aftercare" },
      { label: "Dehradun repair service", href: "/hearing-aid-repair-dehradun" },
      { label: "Refund and cancellation", href: "/refund-cancellation" },
      { label: "Contact Audiosen", href: "/contact" },
    ],
    closingTitle: "Describe the fault before sending the device",
    closingDescription:
      "Share the brand, full model, serial number, location, warranty status, symptoms, and relevant photos. Audiosen can confirm whether a support route is available and what records are needed.",
  },
} satisfies Record<string, SeoLandingPageContent>;
