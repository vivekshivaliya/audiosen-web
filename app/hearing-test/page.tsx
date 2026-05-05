import type { Metadata } from "next";
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
    <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <Reveal>
        <section className="premium-shell p-7 sm:p-10">
          <p className="premium-eyebrow">
            Audiosen Online Hearing Test
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Easy online hearing screening with clear guidance
          </h1>
          <p className="premium-prose mt-5 max-w-3xl text-base sm:text-lg">
            Do a quick sound check, run ear-by-ear tone screening, and get a clear result summary.
            You will also get reliability feedback and a direct suggestion to confirm diagnosis in a
            Audiosen Hearing Care Clinic.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/#contact" className="premium-button-primary">
              Book Consultation
            </Link>
            <Link href="/#hearingtest" className="premium-button-secondary">
              View Home Test Section
            </Link>
          </div>
        </section>
      </Reveal>

      <section className="mt-10">
        <HearingTest mode="page" />
      </section>
    </main>
  );
}
