export type ServiceFaq = {
  question: string;
  answer: string;
};

export type PublicService = {
  slug: string;
  title: string;
  shortDescription: string;
  introduction: string;
  benefits: string[];
  process: string[];
  faqs: ServiceFaq[];
  audience: string;
  bookingLabel: string;
  enquiryType:
    | "consultation"
    | "appointment"
    | "product_enquiry"
    | "repair"
    | "speech";
  canonicalPath?: string;
};

const commonHearingFaqs: ServiceFaq[] = [
  {
    question: "Do I need an appointment?",
    answer:
      "An appointment is recommended so the team can confirm the appropriate service, location and preparation before you travel.",
  },
  {
    question: "Can this website diagnose hearing loss?",
    answer:
      "No. Website information and browser-based checks are educational only. A suitable in-person clinical assessment is needed for diagnosis and treatment decisions.",
  },
];

export const hearingServices: PublicService[] = [
  {
    slug: "hearing-assessment",
    title: "Hearing Assessment",
    shortDescription: "Plan an appropriate professional assessment for a hearing concern.",
    introduction:
      "A hearing assessment starts with the concern, listening situations and relevant history, then uses age-appropriate clinical tests selected by the professional providing care.",
    benefits: [
      "Clarifies the next appropriate care step",
      "Creates a baseline for professional discussion",
      "Supports informed device and referral decisions",
    ],
    process: [
      "Share the hearing concern and any urgent symptoms",
      "Confirm the appropriate assessment and appointment",
      "Attend the assessment and review the results with a professional",
      "Receive a documented next-step plan",
    ],
    faqs: commonHearingFaqs,
    audience: "Adults, seniors and families seeking an appropriate hearing assessment pathway.",
    bookingLabel: "Book Hearing Assessment",
    enquiryType: "appointment",
  },
  {
    slug: "hearing-aid-consultation",
    title: "Hearing Aid Consultation",
    shortDescription: "Discuss hearing needs, daily routines and modern device options.",
    introduction:
      "A consultation helps translate an existing professional assessment and real-life listening priorities into device styles and features worth discussing. It is not a prescription by the website.",
    benefits: [
      "Compare device styles without unsupported sales claims",
      "Consider comfort, controls, charging and connectivity",
      "Understand fitting, follow-up and written quote requirements",
    ],
    process: [
      "Share an existing assessment if available",
      "Discuss communication goals and device preferences",
      "Shortlist options for professional evaluation",
      "Confirm fitting, after-care and written commercial terms",
    ],
    faqs: commonHearingFaqs,
    audience: "People with a professional hearing assessment who want help comparing hearing-aid options.",
    bookingLabel: "Book Hearing Aid Consultation",
    enquiryType: "consultation",
  },
  {
    slug: "hearing-aid-fitting",
    title: "Hearing Aid Fitting",
    shortDescription: "Plan the physical fit, orientation and initial support for a selected device.",
    introduction:
      "Good fitting considers the ear, device style, comfort, handling and the professional programming plan. Device and appointment availability are confirmed before booking.",
    benefits: [
      "Comfort and retention checks",
      "Practical handling and care guidance",
      "A clear plan for early follow-up",
    ],
    process: [
      "Confirm the selected device and assessment record",
      "Schedule a fitting appointment",
      "Complete fit, orientation and professional programming",
      "Arrange follow-up based on real-world experience",
    ],
    faqs: commonHearingFaqs,
    audience: "New or existing hearing-aid users who need fitting and orientation support.",
    bookingLabel: "Request a Fitting Appointment",
    enquiryType: "appointment",
  },
  {
    slug: "hearing-aid-programming",
    title: "Hearing Aid Programming",
    shortDescription: "Request professional adjustment of compatible hearing aids.",
    introduction:
      "Programming is based on the device, assessment information and reported listening experience. Compatibility and service scope must be checked before an appointment is confirmed.",
    benefits: [
      "Discuss clarity, comfort and listening priorities",
      "Review device-program and control use",
      "Document follow-up observations",
    ],
    process: [
      "Share brand, model and current concern",
      "Confirm compatibility and appointment requirements",
      "Attend a professional adjustment session",
      "Review the result in everyday listening",
    ],
    faqs: commonHearingFaqs,
    audience: "Existing hearing-aid users seeking compatible programming support.",
    bookingLabel: "Request Programming Support",
    enquiryType: "appointment",
  },
  {
    slug: "hearing-aid-cleaning",
    title: "Hearing Aid Cleaning",
    shortDescription: "Request safe cleaning and a basic device-care check.",
    introduction:
      "Regular cleaning can help keep microphones, receivers, vents and user-replaceable parts clear. The team first confirms the device and service scope.",
    benefits: [
      "Care appropriate to the device style",
      "Practical home-cleaning guidance",
      "Escalation when repair may be needed",
    ],
    process: [
      "Share the brand, model and current issue",
      "Confirm cleaning or repair intake",
      "Complete the agreed care service",
      "Receive handling and maintenance guidance",
    ],
    faqs: commonHearingFaqs,
    audience: "Hearing-aid users who need routine device cleaning or care guidance.",
    bookingLabel: "Request Device Cleaning",
    enquiryType: "repair",
  },
  {
    slug: "hearing-aid-maintenance",
    title: "Hearing Aid Maintenance",
    shortDescription: "Plan routine checks and support for day-to-day device reliability.",
    introduction:
      "Maintenance needs vary by model, use and environment. Audiosen confirms the device, issue and supported work before accepting a service request.",
    benefits: [
      "A structured device-care review",
      "Help identifying consumable or repair needs",
      "Clear next steps and written service scope",
    ],
    process: [
      "Submit device and issue details",
      "Confirm intake and supported service",
      "Inspect and complete approved maintenance",
      "Record recommendations for future care",
    ],
    faqs: commonHearingFaqs,
    audience: "People seeking routine maintenance for an existing hearing aid.",
    bookingLabel: "Request Maintenance",
    enquiryType: "repair",
  },
  {
    slug: "senior-hearing-care",
    title: "Senior Hearing Care",
    shortDescription: "Support older adults and families through a calm, practical care journey.",
    introduction:
      "Senior hearing care considers communication goals, dexterity, vision, support at home and ease of daily use. Recommendations follow an appropriate professional assessment.",
    benefits: [
      "Family-inclusive communication planning",
      "Practical device-handling considerations",
      "A follow-up plan suited to everyday routines",
    ],
    process: [
      "Discuss current communication difficulties",
      "Plan the appropriate assessment",
      "Review support and device options if indicated",
      "Arrange follow-up and family guidance",
    ],
    faqs: commonHearingFaqs,
    audience: "Older adults, caregivers and families planning hearing support.",
    bookingLabel: "Book Senior Hearing Consultation",
    enquiryType: "consultation",
  },
  {
    slug: "pediatric-hearing-care",
    title: "Pediatric Hearing Care",
    shortDescription: "Start with an age-appropriate professional pathway for a child.",
    introduction:
      "Children should not receive device recommendations from an online finder. A qualified professional must select age-appropriate assessment and coordinate any required referral or communication support.",
    benefits: [
      "Child-appropriate assessment planning",
      "Parent and caregiver participation",
      "Coordination with speech and communication support when appropriate",
    ],
    process: [
      "Share the concern and child age group",
      "Screen for urgent or referral needs",
      "Confirm an age-appropriate assessment pathway",
      "Review results and coordinated next steps",
    ],
    faqs: [
      {
        question: "Can the online hearing check be used for children?",
        answer:
          "No. The browser check is not designed or calibrated for children. Please request a pediatric professional assessment.",
      },
      ...commonHearingFaqs,
    ],
    audience: "Parents and caregivers concerned about a child’s hearing or communication.",
    bookingLabel: "Book a Child Assessment",
    enquiryType: "appointment",
  },
  {
    slug: "hearing-aid-follow-up",
    title: "Hearing Aid Follow-Up",
    shortDescription: "Review comfort, use and real-world listening after fitting.",
    introduction:
      "Follow-up creates space to discuss daily experience, handling and concerns that may require professional adjustment or additional support.",
    benefits: [
      "A structured review of real-world experience",
      "Support for controls, care and routines",
      "Clear escalation for adjustment or repair",
    ],
    process: [
      "Record listening situations and concerns",
      "Confirm the correct follow-up service",
      "Review device use with the care team",
      "Agree the next check-in or service action",
    ],
    faqs: commonHearingFaqs,
    audience: "Existing hearing-aid users who need after-care or a scheduled review.",
    bookingLabel: "Book Follow-Up",
    enquiryType: "appointment",
  },
  {
    slug: "hearing-device-accessories",
    title: "Hearing Device Accessories",
    shortDescription: "Ask about compatible care items and connectivity accessories.",
    introduction:
      "Accessory compatibility is model-specific. Audiosen checks the exact hearing aid and requested use before confirming availability or price.",
    benefits: [
      "Compatibility checked before recommendation",
      "Guidance for charging, care and connectivity",
      "Written price and availability confirmation",
    ],
    process: [
      "Share the hearing-aid brand and model",
      "Describe the accessory or use needed",
      "Receive a compatibility check",
      "Confirm availability and written quote",
    ],
    faqs: commonHearingFaqs,
    audience: "Hearing-aid users looking for model-compatible accessories or care items.",
    bookingLabel: "Ask About Accessories",
    enquiryType: "product_enquiry",
  },
];

export const speechServices: PublicService[] = [
  {
    slug: "speech-assessment",
    title: "Speech Assessment",
    shortDescription: "Request an appropriate communication assessment and next-step plan.",
    introduction:
      "Speech and communication concerns vary by age and context. Audiosen first confirms service availability and the appropriate qualified professional before an appointment is accepted.",
    benefits: ["Clarify the concern and goals", "Choose an age-appropriate assessment", "Plan family-supported next steps"],
    process: ["Share the concern and age group", "Confirm provider and service availability", "Attend the agreed assessment", "Review the professional plan"],
    faqs: [],
    audience: "Children, adults and families seeking an initial communication assessment.",
    bookingLabel: "Book Speech Assessment",
    enquiryType: "speech",
  },
  {
    slug: "speech-therapy",
    title: "Speech Therapy",
    shortDescription: "Discuss individualized speech and communication support.",
    introduction:
      "Therapy goals and frequency must follow assessment by an appropriately qualified professional. The website does not promise a program before that review.",
    benefits: ["Individual goal planning", "Practice linked to everyday communication", "Progress review with families where appropriate"],
    process: ["Request a consultation", "Confirm assessment needs", "Agree goals with the professional", "Review progress at suitable intervals"],
    faqs: [],
    audience: "People seeking professional speech and communication support.",
    bookingLabel: "Book Speech Consultation",
    enquiryType: "speech",
  },
  {
    slug: "language-development",
    title: "Language Development",
    shortDescription: "Explore professional support for understanding and using language.",
    introduction:
      "Language support is based on age, communication context and assessment. Hearing concerns may need to be considered as part of a coordinated pathway.",
    benefits: ["Family-centred goal setting", "Everyday communication strategies", "Coordination with hearing assessment when appropriate"],
    process: ["Share current concerns", "Confirm assessment and provider availability", "Agree practical goals", "Review progress and next steps"],
    faqs: [],
    audience: "Families seeking guidance about a child’s language development.",
    bookingLabel: "Discuss Language Support",
    enquiryType: "speech",
  },
  {
    slug: "articulation-support",
    title: "Articulation Support",
    shortDescription: "Discuss concerns about speech-sound clarity with a professional.",
    introduction:
      "Unclear speech can have different causes. An assessment helps determine whether professional support is appropriate and what goals make sense.",
    benefits: ["Clear description of current speech patterns", "Individual practice goals", "Home guidance when appropriate"],
    process: ["Share examples and context", "Arrange an appropriate assessment", "Agree goals with the professional", "Practise and review"],
    faqs: [],
    audience: "Children or adults with concerns about speech-sound clarity.",
    bookingLabel: "Book Articulation Consultation",
    enquiryType: "speech",
  },
  {
    slug: "fluency-support",
    title: "Fluency Support",
    shortDescription: "Request respectful assessment for stammering or fluency concerns.",
    introduction:
      "Fluency experiences are personal and should not be judged from a website checklist. A qualified professional can assess the concern, impact and suitable support.",
    benefits: ["Respectful, person-centred discussion", "Goals based on communication impact", "Family guidance when appropriate"],
    process: ["Share the concern privately", "Confirm qualified provider availability", "Attend an assessment", "Agree a supportive plan"],
    faqs: [],
    audience: "Children, adults and families seeking help with fluency concerns.",
    bookingLabel: "Book Fluency Consultation",
    enquiryType: "speech",
  },
  {
    slug: "listening-communication-support",
    title: "Listening & Communication Support",
    shortDescription: "Coordinate listening goals with hearing and communication care.",
    introduction:
      "Some people benefit from coordinated hearing, device and communication support. The appropriate pathway depends on professional assessment and locally available care.",
    benefits: ["Connect hearing and communication goals", "Practical listening strategies", "Coordinated follow-up where available"],
    process: ["Describe daily listening challenges", "Review relevant hearing information", "Confirm professional service availability", "Agree practical next steps"],
    faqs: [],
    audience: "People exploring communication support alongside hearing care.",
    bookingLabel: "Discuss Communication Support",
    enquiryType: "speech",
  },
  {
    slug: "parent-guidance",
    title: "Parent Guidance",
    shortDescription: "Help families understand appropriate hearing and communication next steps.",
    introduction:
      "Guidance helps parents observe communication in context, use supportive interaction strategies and decide when an assessment is appropriate. It does not replace assessment.",
    benefits: ["Practical family communication ideas", "Clear referral and assessment guidance", "Support for informed questions"],
    process: ["Share the child’s age group and concern", "Confirm the right professional pathway", "Attend a parent consultation", "Use and review agreed strategies"],
    faqs: [],
    audience: "Parents and caregivers seeking structured communication guidance.",
    bookingLabel: "Book Parent Guidance",
    enquiryType: "speech",
  },
];

export function getHearingService(slug: string): PublicService | undefined {
  return hearingServices.find((service) => service.slug === slug);
}

export function getSpeechService(slug: string): PublicService | undefined {
  return speechServices.find((service) => service.slug === slug);
}
