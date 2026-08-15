export type BlogSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  category: string;
  image: string;
  imageAlt: string;
  publishedAt: string;
  updatedAt: string;
  readTime: string;
  introduction: string;
  sections: BlogSection[];
  relatedHref: string;
  relatedLabel: string;
  sources: Array<{
    label: string;
    href: string;
  }>;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "when-to-get-a-hearing-test",
    title: "When Should You Get a Hearing Test?",
    description:
      "Learn which hearing changes and risk factors should prompt a professional hearing assessment and what to prepare before your appointment.",
    excerpt:
      "Hearing changes can be gradual. Learn which everyday signs deserve attention and what happens after you decide to get assessed.",
    category: "Hearing assessment",
    image: "/images/contact-audiologist-doctor.jpg",
    imageAlt: "A patient discussing a clinic hearing assessment",
    publishedAt: "2026-08-15",
    updatedAt: "2026-08-15",
    readTime: "5 min read",
    introduction:
      "Many people notice hearing difficulty first in busy restaurants, family conversations, television, or phone calls. A professional assessment can establish a baseline, explain what may be happening, and identify whether medical or hearing-care follow-up is appropriate.",
    sections: [
      {
        heading: "Signs that justify an assessment",
        bullets: [
          "You frequently ask people to repeat themselves.",
          "Speech sounds unclear even when it is loud enough.",
          "Conversations in background noise require unusual effort.",
          "Family members comment on television or phone volume.",
          "You notice persistent tinnitus or a difference between ears.",
          "You have regular occupational or recreational noise exposure.",
        ],
      },
      {
        heading: "Do not wait on sudden symptoms",
        paragraphs: [
          "Sudden or rapidly worsening hearing loss is different from a gradual change. If hearing changes suddenly—especially in one ear—or occurs with significant dizziness, pain, discharge, or injury, seek prompt medical assessment instead of relying on an online test.",
        ],
      },
      {
        heading: "How to prepare",
        bullets: [
          "Write down when the difficulty started and where it is most noticeable.",
          "Bring previous audiograms, relevant medical records, and a medication list if available.",
          "Bring current hearing aids, chargers, and accessories.",
          "Ask a family member to join if they can describe communication changes.",
        ],
      },
      {
        heading: "Screening versus clinic evaluation",
        paragraphs: [
          "An online screening may help you decide whether to seek care, but device volume, headphones, and room noise affect the result. It cannot diagnose the cause of hearing loss. A clinic evaluation uses appropriate equipment and professional interpretation.",
        ],
      },
    ],
    relatedHref: "/hearing-test-dehradun",
    relatedLabel: "Book a hearing test in Dehradun",
    sources: [
      {
        label: "WHO: Deafness and hearing loss",
        href: "https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss",
      },
      {
        label: "Government of India: National Programme for Prevention and Control of Deafness",
        href: "https://dghs.mohfw.gov.in/national-programme-for-prevention-and-control-of-deafness.php",
      },
    ],
  },
  {
    slug: "signs-you-may-need-hearing-aids",
    title: "5 Signs You May Need Hearing-Aid Guidance",
    description:
      "Understand five common signs of hearing difficulty and why a hearing assessment should come before choosing a hearing aid.",
    excerpt:
      "Five common listening difficulties can signal that it is time for an assessment—not necessarily that you should buy a device immediately.",
    category: "Hearing aids",
    image: "/images/products/real-oticon-top-view.jpg",
    imageAlt: "A modern hearing aid held during a device consultation",
    publishedAt: "2026-08-15",
    updatedAt: "2026-08-15",
    readTime: "5 min read",
    introduction:
      "Hearing aids can help many people, but the right starting point is understanding the hearing problem. These common signs suggest that a professional assessment may be worthwhile.",
    sections: [
      {
        heading: "1. Speech is difficult in background noise",
        paragraphs: [
          "Restaurants, family gatherings, and meetings combine multiple voices with competing sound. If you hear people speaking but cannot follow the words, record where and how often this happens.",
        ],
      },
      {
        heading: "2. You regularly ask for repetition",
        paragraphs: [
          "Occasional misunderstanding is normal. Repeated difficulty with soft voices, distant speakers, or consonants can justify a hearing check.",
        ],
      },
      {
        heading: "3. Volume is becoming a family issue",
        paragraphs: [
          "If other people consistently find the television or phone too loud, there may be a difference between the volume you need and what feels comfortable to them.",
        ],
      },
      {
        heading: "4. Listening leaves you tired or withdrawn",
        paragraphs: [
          "Concentrating intensely to follow speech can make social situations tiring. Avoiding calls or gatherings because communication feels difficult is a meaningful quality-of-life signal.",
        ],
      },
      {
        heading: "5. Tinnitus or uneven hearing persists",
        paragraphs: [
          "Persistent ringing or a noticeable difference between ears should be discussed with an appropriate professional. Sudden one-sided change requires prompt medical assessment.",
        ],
      },
      {
        heading: "Assessment comes before the product",
        paragraphs: [
          "A useful recommendation considers hearing results, ear health, communication priorities, dexterity, phone use, budget, fitting, and aftercare. Avoid choosing only by appearance or an online feature list.",
        ],
      },
    ],
    relatedHref: "/hearing-aids-dehradun",
    relatedLabel: "Explore hearing aids in Dehradun",
    sources: [
      {
        label: "NIDCD: Age-related hearing loss",
        href: "https://www.nidcd.nih.gov/health/age-related-hearing-loss",
      },
      {
        label: "WHO: Deafness and hearing loss",
        href: "https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss",
      },
    ],
  },
  {
    slug: "protect-your-hearing-from-noise",
    title: "How to Protect Your Hearing From Noise",
    description:
      "Practical ways to reduce recreational and workplace noise exposure and recognize when a hearing assessment may be helpful.",
    excerpt:
      "A practical guide to safer listening, hearing protection, quiet breaks, and warning signs after loud-noise exposure.",
    category: "Prevention",
    image: "/images/blog/noise-protection-guide.svg",
    imageAlt: "Illustration showing practical hearing-protection habits",
    publishedAt: "2026-08-15",
    updatedAt: "2026-08-15",
    readTime: "6 min read",
    introduction:
      "Noise-induced hearing loss is preventable, but risk depends on both sound level and exposure time. Concerts, headphones, machinery, traffic, and power tools can all contribute when listening is too loud for too long.",
    sections: [
      {
        heading: "Reduce level, duration, or both",
        bullets: [
          "Move farther from loudspeakers and machinery where possible.",
          "Lower personal-device volume and avoid compensating for noisy surroundings.",
          "Take quiet breaks during long events or work periods.",
          "Use suitable hearing protection for the activity and fit it correctly.",
        ],
      },
      {
        heading: "Choose protection for the situation",
        paragraphs: [
          "Foam plugs, reusable plugs, earmuffs, and level-dependent protection serve different needs. Workplace protection should follow the employer's safety program. Musicians and frequent event-goers may prefer protection designed to reduce volume while preserving sound balance.",
        ],
      },
      {
        heading: "Watch for warning signs",
        bullets: [
          "Ringing or buzzing after noise exposure.",
          "Muffled hearing or a blocked sensation that persists.",
          "Difficulty understanding speech after a loud event.",
          "Pain, sudden hearing change, or dizziness requiring prompt assessment.",
        ],
      },
      {
        heading: "Make safe listening a routine",
        paragraphs: [
          "Keep hearing protection with the equipment or bag you use for noisy activities. Use device volume warnings as prompts, and give children appropriately fitted protection without assuming that any plug or muff fits every ear.",
        ],
      },
    ],
    relatedHref: "/hearing-test-dehradun",
    relatedLabel: "Discuss a hearing assessment",
    sources: [
      {
        label: "WHO: Make Listening Safe",
        href: "https://www.who.int/activities/making-listening-safe",
      },
      {
        label: "NIDCD: Noise-induced hearing loss",
        href: "https://www.nidcd.nih.gov/health/noise-induced-hearing-loss",
      },
    ],
  },
  {
    slug: "talk-to-family-about-hearing-loss",
    title: "How to Talk to Family About Hearing Loss",
    description:
      "Use a respectful, practical conversation to help a loved one consider a hearing assessment without pressure or stigma.",
    excerpt:
      "A respectful conversation can make hearing care feel supportive instead of confrontational. Start with specific situations and shared goals.",
    category: "Family support",
    image: "/images/contact-audiologist-doctor-hq.jpg",
    imageAlt: "A family member supporting someone during a hearing-care discussion",
    publishedAt: "2026-08-15",
    updatedAt: "2026-08-15",
    readTime: "5 min read",
    introduction:
      "A person may not notice a gradual hearing change as quickly as their family does. Conversations go better when they focus on communication and independence rather than blame, age, or a predetermined product.",
    sections: [
      {
        heading: "Choose the right moment",
        paragraphs: [
          "Talk privately when everyone is calm. Avoid raising the subject immediately after a frustrating misunderstanding or in front of a group.",
        ],
      },
      {
        heading: "Use specific, neutral examples",
        bullets: [
          "I noticed phone calls have become harder to follow.",
          "Family meals seem tiring when several people speak.",
          "Would you be open to getting a baseline hearing check together?",
        ],
      },
      {
        heading: "Offer support, not a diagnosis",
        paragraphs: [
          "Do not assume the cause or insist that a hearing aid is the only answer. Offer to research a qualified provider, attend the appointment, organize previous reports, or help write down questions.",
        ],
      },
      {
        heading: "Improve communication now",
        bullets: [
          "Get the person's attention before speaking.",
          "Face them and keep your mouth visible.",
          "Reduce background noise when possible.",
          "Speak clearly at a natural pace instead of shouting.",
          "Rephrase a sentence if repeating the same words does not help.",
        ],
      },
    ],
    relatedHref: "/hearing-test-dehradun",
    relatedLabel: "Plan a hearing assessment in Dehradun",
    sources: [
      {
        label: "NIDCD: Age-related hearing loss",
        href: "https://www.nidcd.nih.gov/health/age-related-hearing-loss",
      },
    ],
  },
  {
    slug: "modern-hearing-aid-features",
    title: "Modern Hearing-Aid Features: What Actually Matters?",
    description:
      "Compare rechargeable batteries, phone connectivity, automatic programs, apps, microphones, and fitting support without buying by features alone.",
    excerpt:
      "Rechargeability, connectivity and automation can be useful, but the best feature set depends on your hearing, daily life and follow-up support.",
    category: "Technology",
    image: "/images/products/official/signia-ix.jpg",
    imageAlt: "Modern rechargeable hearing aid technology",
    publishedAt: "2026-08-15",
    updatedAt: "2026-08-15",
    readTime: "6 min read",
    introduction:
      "Modern hearing aids may include rechargeable batteries, phone streaming, remote controls, automatic listening programs, directional microphones, and companion apps. The useful question is not which model has the longest feature list, but which features solve real listening problems for you.",
    sections: [
      {
        heading: "Rechargeable or replaceable batteries",
        paragraphs: [
          "Rechargeable devices can simplify daily handling, while replaceable batteries may suit people who cannot reliably access charging. Consider dexterity, travel, daily wear time, charger portability, and battery replacement availability.",
        ],
      },
      {
        heading: "Phone and media connectivity",
        paragraphs: [
          "Compatibility varies by device, phone, operating system, and accessory. If calls or media streaming matter, test the exact phone and hearing-aid combination before purchase and ask how pairing support is handled.",
        ],
      },
      {
        heading: "Automatic listening and noise features",
        paragraphs: [
          "Automatic programs and directional microphones can help in changing environments, but no device removes all background noise. Discuss the places where you struggle most and set realistic expectations during fitting.",
        ],
      },
      {
        heading: "Apps and user controls",
        paragraphs: [
          "Apps can provide volume, program, battery, and support controls. They are only valuable if the interface is comfortable for the wearer or caregiver, and if essential device functions remain manageable without the phone.",
        ],
      },
      {
        heading: "Fitting and follow-up remain essential",
        paragraphs: [
          "The device must be selected and adjusted for the hearing profile, comfort, communication priorities, and safe use. Ask what follow-up adjustments, care instruction, warranty support, and repair coordination are included.",
        ],
      },
    ],
    relatedHref: "/hearing-aid-prices-dehradun",
    relatedLabel: "Compare hearing-aid options and costs",
    sources: [
      {
        label: "WHO: Hearing aid technology product specification",
        href: "https://iris.who.int/handle/10665/376092",
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
