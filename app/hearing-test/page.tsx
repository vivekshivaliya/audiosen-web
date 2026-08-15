import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HearingTest } from "@/components/hearing-test";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Online Hearing Test India | Audiosen Sound Check",
  description:
    "Take Audiosen's private device-relative online hearing sound check in India, with setup checks, ear-by-ear tones, consistency feedback, and safe next steps.",
  alternates: {
    canonical: "/hearing-test",
  },
  openGraph: {
    title: "Online Hearing Test India | Audiosen Sound Check",
    description:
      "A private device-relative sound check with ear-by-ear tones and clear guidance on when to arrange a clinical assessment.",
    url: "https://audiosen.com/hearing-test",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/images/editorial/hearing-test-consultation-v2.webp",
        alt: "An older Indian patient completing a hearing assessment with an audiology professional",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Hearing Test India | Audiosen Sound Check",
    description: "A private online sound check with ear-by-ear tones and safe next-step guidance.",
    images: ["/images/editorial/hearing-test-consultation-v2.webp"],
  },
};

export default function HearingTestPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <Reveal>
        <section className="premium-shell sonic-screening-hero">
          <div>
            <p className="premium-eyebrow">Audiosen Sound Check · device-relative</p>
            <h1 className="sonic-hero-title mt-4 font-display font-semibold leading-tight text-slate-900">
              Online Hearing Sound Check for People Across India
            </h1>
            <p className="premium-prose mt-5 max-w-3xl text-base sm:text-lg">
              Check whether you notice a small set of ear-by-ear tones, get response-consistency feedback,
              and choose a safe next step. No account is required and no clinical dB result is claimed.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/#contact" className="premium-button-primary">Book Consultation</Link>
              <Link href="#start-check" className="premium-button-secondary">Start safely</Link>
            </div>
          </div>
          <div className="sonic-screening-image">
            <Image src="/images/editorial/hearing-test-consultation-v2.webp" alt="An older Indian patient completing a hearing assessment with an audiology professional" width={1600} height={900} priority />
            <span>Online orientation + clinic handoff</span>
          </div>
        </section>
      </Reveal>

      <section id="start-check" className="mt-10 scroll-mt-32">
        <HearingTest mode="page" />
      </section>
    </main>
  );
}
