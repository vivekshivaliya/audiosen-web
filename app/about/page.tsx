import type { Metadata } from "next";
import { infoPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "About Audiosen | Hearing Care Clinic in Dehradun",
  description:
    "Learn about Audiosen Hearing Care, our mission, and our hearing services for children, adults, seniors, and families in Dehradun.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  const content = infoPages.about;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-14 sm:px-6 lg:px-8">
      <section className="premium-shell p-8 sm:p-10">
        <p className="premium-eyebrow mb-4">
            About Our Company
        </p>

        <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          {content.title}
        </h1>

        <div className="premium-prose mt-6 space-y-5 text-base">
          {content.paragraphs.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="premium-card p-5">
            <h2 className="text-lg font-semibold text-slate-900">Our Mission</h2>
            <p className="mt-2 text-sm text-slate-600">
              To make hearing care simple, trustworthy, and accessible.
            </p>
          </div>
          <div className="premium-card p-5">
            <h2 className="text-lg font-semibold text-slate-900">What We Do</h2>
            <p className="mt-2 text-sm text-slate-600">
              Consultation, hearing tests, hearing aid sales, fitting, repair, and aftercare.
            </p>
          </div>
          <div className="premium-card p-5">
            <h2 className="text-lg font-semibold text-slate-900">Who We Help</h2>
            <p className="mt-2 text-sm text-slate-600">
              Children, adults, seniors, and families needing hearing support.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
