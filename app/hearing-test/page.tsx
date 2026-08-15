import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HearingTest } from "@/components/hearing-test";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Online Hearing Test | Audiosen",
  description:
    "Take Audiosen's guided online hearing screening with setup checks, ear-by-ear tone testing, and a clear result summary.",
  alternates: {
    canonical: "/hearing-test",
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
              A calmer first step before a clinical hearing assessment
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
