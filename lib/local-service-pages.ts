export type LocalServicePageContent = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  introduction: string;
  image: string;
  imageAlt: string;
  highlights: Array<{
    title: string;
    description: string;
  }>;
  steps: Array<{
    title: string;
    description: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export const localServicePages = {
  hearingTest: {
    slug: "hearing-test-dehradun",
    metaTitle: "Hearing Test in Dehradun | PTA & Speech Audiometry | Audiosen",
    metaDescription:
      "Book a clinic hearing test in Dehradun at Audiosen. Discuss Pure Tone Audiometry, speech testing, results, and suitable next steps.",
    eyebrow: "Clinic hearing assessment",
    title: "Hearing Test in Dehradun",
    introduction:
      "A clinic hearing assessment helps clarify what you are noticing and which next step is appropriate. Audiosen provides hearing-test guidance and hearing-care support in Dehradun, with in-person details confirmed before booking.",
    image: "/images/contact-audiologist-doctor.jpg",
    imageAlt: "Clinic hearing assessment equipment in Dehradun",
    highlights: [
      {
        title: "Pure Tone Audiometry",
        description:
          "Measures hearing thresholds across different sound frequencies using clinic equipment.",
      },
      {
        title: "Speech assessment",
        description:
          "Helps evaluate how clearly speech is heard and understood in relevant listening situations.",
      },
      {
        title: "Results discussion",
        description:
          "Review the findings, your listening needs, and whether follow-up care or device guidance is appropriate.",
      },
      {
        title: "Family-friendly guidance",
        description:
          "A family member can join the discussion so the next steps are understood clearly.",
      },
    ],
    steps: [
      {
        title: "Share your concerns",
        description:
          "Tell the team about conversations, television, phone calls, tinnitus, noise exposure, and any recent changes.",
      },
      {
        title: "Choose the right assessment",
        description:
          "The clinic identifies which hearing checks are suitable for your age, symptoms, and history.",
      },
      {
        title: "Complete the evaluation",
        description:
          "Follow the test instructions in a quiet clinical setting and ask questions whenever needed.",
      },
      {
        title: "Understand the next step",
        description:
          "Discuss the result, referral needs, hearing protection, follow-up, or hearing-aid options without pressure.",
      },
    ],
    faqs: [
      {
        question: "Is the online hearing test a diagnosis?",
        answer:
          "No. Audiosen's online test is a screening tool only. A clinic-based evaluation is needed for diagnosis and treatment advice.",
      },
      {
        question: "How long does a hearing test take?",
        answer:
          "The time depends on the type of assessment and your hearing history. Call before visiting so the clinic can reserve an appropriate appointment.",
      },
      {
        question: "Should I bring my current hearing aids?",
        answer:
          "Yes. Bring the devices, charger, accessories, previous audiograms, and relevant medical documents if available.",
      },
      {
        question: "What if my hearing changed suddenly?",
        answer:
          "Sudden or rapidly worsening hearing loss, especially with dizziness, pain, discharge, or one-sided symptoms, needs prompt medical assessment rather than an online screening.",
      },
    ],
  },
  hearingAidPrices: {
    slug: "hearing-aid-prices-dehradun",
    metaTitle: "Hearing Aid Prices in Dehradun | Audiosen",
    metaDescription:
      "Understand what affects hearing aid prices in Dehradun and request a written Audiosen quote based on hearing needs, features, fitting, and support.",
    eyebrow: "Clear device guidance",
    title: "Hearing Aid Prices in Dehradun",
    introduction:
      "There is no single hearing-aid price that suits every person. Cost depends on the hearing profile, device style, technology, warranty, fitting needs, and after-sales support. Audiosen helps you compare suitable options and request a clear quote.",
    image: "/images/editorial/hearing-aid-guidance-v2.webp",
    imageAlt: "Modern hearing aid discussed during a price consultation in Dehradun",
    highlights: [
      {
        title: "Hearing needs",
        description:
          "The type and degree of hearing difficulty influence which devices and power levels may be suitable.",
      },
      {
        title: "Technology level",
        description:
          "Speech-in-noise features, rechargeability, connectivity, and automation can affect the price.",
      },
      {
        title: "Style and accessories",
        description:
          "Behind-the-ear, receiver-in-canal, custom devices, chargers, and accessories have different costs.",
      },
      {
        title: "Fitting and support",
        description:
          "Ask what programming, follow-up adjustments, warranty support, and maintenance are included in the quote.",
      },
    ],
    steps: [
      {
        title: "Assess",
        description:
          "Start with an appropriate hearing evaluation or bring a recent audiogram for review.",
      },
      {
        title: "Set priorities",
        description:
          "Discuss your daily listening environments, preferred style, phone use, dexterity, and budget.",
      },
      {
        title: "Compare options",
        description:
          "Compare a small shortlist by suitability, included care, warranty, and total value—not features alone.",
      },
      {
        title: "Request a written quote",
        description:
          "Confirm the model, device count, included services, accessories, warranty, and payment terms before purchase.",
      },
    ],
    faqs: [
      {
        question: "Why are hearing aid prices so different?",
        answer:
          "Prices vary by device style, technology platform, performance in complex listening situations, rechargeability, accessories, warranty, and included professional support.",
      },
      {
        question: "Can I get a price before visiting?",
        answer:
          "The team can explain broad options by phone or WhatsApp, but a reliable recommendation normally requires hearing information and a discussion of your needs.",
      },
      {
        question: "Does a higher price always mean a better result?",
        answer:
          "Not automatically. Suitability, professional fitting, realistic expectations, and follow-up adjustments are as important as the technology level.",
      },
      {
        question: "How do I confirm the complete payable amount?",
        answer:
          "Request a written quote that identifies the device, included services, accessories, warranty, taxes, and payment terms before purchase.",
      },
    ],
  },
  hearingAidRepair: {
    slug: "hearing-aid-repair-dehradun",
    metaTitle: "Hearing Aid Repair in Dehradun | Audiosen",
    metaDescription:
      "Request hearing aid cleaning, troubleshooting, maintenance, adjustment, or repair guidance from Audiosen in Dehradun. In-person details are confirmed before booking.",
    eyebrow: "Device care and troubleshooting",
    title: "Hearing Aid Repair in Dehradun",
    introduction:
      "Weak sound, feedback, charging problems, intermittent performance, or physical damage can have different causes. Audiosen helps inspect the device, explain the likely next step, and coordinate appropriate service support.",
    image: "/images/editorial/hearing-aid-guidance-v2.webp",
    imageAlt: "Hearing aid maintenance and repair service in Dehradun",
    highlights: [
      {
        title: "Cleaning and checks",
        description:
          "Inspect common issues involving wax guards, domes, tubing, microphone openings, and battery contacts.",
      },
      {
        title: "Performance troubleshooting",
        description:
          "Review weak, distorted, intermittent, or feedback-related performance before deciding on repair.",
      },
      {
        title: "Programming support",
        description:
          "When appropriate, review whether fitting settings or follow-up adjustments need attention.",
      },
      {
        title: "Manufacturer coordination",
        description:
          "Issues requiring specialist parts or laboratory work may need brand-authorized service and a separate estimate.",
      },
    ],
    steps: [
      {
        title: "Bring the complete kit",
        description:
          "Bring the hearing aid, charger, case, accessories, purchase record, and warranty information if available.",
      },
      {
        title: "Describe the problem",
        description:
          "Explain when the issue started, whether it affects one or both devices, and what troubleshooting you tried.",
      },
      {
        title: "Inspection and estimate",
        description:
          "The team checks the device and explains whether routine maintenance or external repair may be required.",
      },
      {
        title: "Test before collection",
        description:
          "Review the completed work, charges, warranty status, and care instructions before taking the device home.",
      },
    ],
    faqs: [
      {
        question: "Can Audiosen repair every hearing aid brand?",
        answer:
          "Serviceability depends on the brand, model, age, parts, warranty status, and fault. Contact the clinic with the model details before visiting.",
      },
      {
        question: "Will the repair be completed the same day?",
        answer:
          "Simple maintenance may be quicker, while parts, physical damage, or manufacturer service can take longer. The team will explain the expected process after inspection.",
      },
      {
        question: "What should I bring for a repair visit?",
        answer:
          "Bring both devices where applicable, the charger or batteries, accessories, purchase invoice, warranty card, and previous service records.",
      },
      {
        question: "Should I open or dry the device using heat?",
        answer:
          "Do not open the casing or use direct heat. Switch the device off, keep it dry, and ask for professional guidance to avoid additional damage.",
      },
    ],
  },
  hearingAidFitting: {
    slug: "hearing-aid-fitting-dehradun",
    metaTitle: "Hearing Aid Fitting in Dehradun | Audiosen",
    metaDescription:
      "Arrange hearing-aid fitting, programming, orientation, and aftercare support in Dehradun with Audiosen. Call before travelling to confirm your appointment.",
    eyebrow: "Fitting and aftercare",
    title: "Hearing Aid Fitting in Dehradun",
    introduction:
      "A hearing aid works best when the style, settings, handling, and follow-up are discussed around the person using it. Audiosen provides fitting and aftercare guidance in Dehradun, with appointments confirmed in advance.",
    image: "/images/editorial/hearing-aid-guidance-v2.webp",
    imageAlt: "Hearing aid fitting and follow-up discussion in Dehradun",
    highlights: [
      { title: "Device orientation", description: "Learn how to insert, remove, charge or change batteries, clean the device, and use its everyday controls." },
      { title: "Programming discussion", description: "Discuss listening goals and any comfort concerns so appropriate adjustments can be considered during follow-up." },
      { title: "Communication practice", description: "Try common listening situations such as conversation, calls, and television, then share what feels difficult." },
      { title: "Aftercare plan", description: "Understand cleaning, storage, scheduled review, and when to seek service support for a change in performance." },
    ],
    steps: [
      { title: "Bring your hearing information", description: "Bring your current audiogram, hearing aids, charger, accessories, and any earlier fitting notes where available." },
      { title: "Discuss daily listening", description: "Explain the places and conversations that matter most, including noise, phone use, and family communication." },
      { title: "Learn safe handling", description: "Review device care, charging or battery routines, feedback, and basic troubleshooting before leaving." },
      { title: "Arrange follow-up", description: "Plan a review if comfort, sound quality, handling, or hearing needs change after fitting." },
    ],
    faqs: [
      { question: "Do I need an audiogram for fitting?", answer: "A recent hearing assessment helps guide a fitting discussion. Bring any existing audiogram and contact Audiosen if you are unsure whether a new assessment is needed." },
      { question: "How many fitting visits are needed?", answer: "Needs differ. Some people need follow-up adjustments while they become accustomed to new amplification. The team can discuss an appropriate review plan." },
      { question: "Can I get help with my current hearing aids?", answer: "Bring the devices, charger or batteries, accessories, and model details. The available support depends on the brand, model, condition, and service history." },
      { question: "What if sound is uncomfortable after fitting?", answer: "Do not try to alter the device yourself. Note when the issue occurs and contact the team for safe guidance or a follow-up appointment." },
    ],
  },
  homeHearingCare: {
    slug: "home-hearing-care-dehradun",
    metaTitle: "Home Hearing Care in Dehradun | Audiosen",
    metaDescription:
      "Ask Audiosen about home hearing-care support in Dehradun for eligible patients, subject to location, clinical suitability, and team availability.",
    eyebrow: "Support for eligible home visits",
    title: "Home Hearing Care in Dehradun",
    introduction:
      "For some older adults and people with limited mobility, travelling to a clinic can be difficult. Audiosen can discuss whether a home visit is suitable for the requested service, location, and available team.",
    image: "/images/contact-hearing-care-clinic.png",
    imageAlt: "Hearing-care consultation support for an older adult",
    highlights: [
      {
        title: "Suitability check",
        description:
          "The team first confirms the patient's concern, mobility needs, location, and whether clinic equipment is required.",
      },
      {
        title: "Family coordination",
        description:
          "A family member or caregiver can help share history, manage documents, and understand follow-up steps.",
      },
      {
        title: "Device support",
        description:
          "Selected hearing-aid guidance, care instruction, and follow-up support may be possible at home.",
      },
      {
        title: "Clinic referral when needed",
        description:
          "Some diagnostic tests, medical symptoms, impressions, or technical services may require a clinic visit.",
      },
    ],
    steps: [
      {
        title: "Call or WhatsApp",
        description:
          "Share the patient's age, area, mobility needs, main hearing concern, and requested service.",
      },
      {
        title: "Confirm suitability",
        description:
          "The team explains what can be provided at home and whether a clinic or medical visit is more appropriate.",
      },
      {
        title: "Agree the visit details",
        description:
          "Confirm availability, address, contact person, expected service, any fee, and documents to keep ready.",
      },
      {
        title: "Plan follow-up",
        description:
          "After the visit, record recommendations, device care instructions, and any clinic or medical follow-up required.",
      },
    ],
    faqs: [
      {
        question: "Are home visits available everywhere in Dehradun?",
        answer:
          "Availability depends on the exact location, requested service, travel schedule, and team capacity. Contact Audiosen for confirmation.",
      },
      {
        question: "Can every hearing test be completed at home?",
        answer:
          "No. Some assessments require controlled clinic conditions or equipment. The team will explain whether a home service is suitable.",
      },
      {
        question: "Is a caregiver required to be present?",
        answer:
          "It is often helpful, especially for an older adult or anyone who needs communication, mobility, consent, or device-care support.",
      },
      {
        question: "Can a home visit handle urgent ear symptoms?",
        answer:
          "A routine home hearing-care request is not an emergency service. Sudden hearing loss, severe pain, discharge, injury, or significant dizziness needs prompt medical assessment.",
      },
    ],
  },
} satisfies Record<string, LocalServicePageContent>;

export const localServicePageList = Object.values(localServicePages);
