import Link from "next/link";
import { callHref, clinicContact } from "@/lib/content";

export function ProgramUnavailable({
  eyebrow,
  title,
  description,
  checks,
}: {
  eyebrow: string;
  title: string;
  description: string;
  checks: string[];
}) {
  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-16">
      <section className="overflow-hidden rounded-[2rem] border border-amber-200 bg-[linear-gradient(135deg,#fffdf7,#eff8f5)] p-7 sm:p-11 lg:p-14">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-amber-800">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl font-display text-5xl font-semibold leading-[1.02] text-slate-950 sm:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{description}</p>

        <div className="mt-9 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[1.5rem] border border-amber-200 bg-white p-6 sm:p-8">
            <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-amber-900">
              Not currently published
            </span>
            <h2 className="mt-5 text-2xl font-bold text-slate-950">Approval gate still applies</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Audiosen will not show a price, saving, deposit, warranty, trial period or eligibility
              claim until it is mapped to approved products or services with dated written terms.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/book-consultation" className="premium-button-primary">Ask for Current Options</Link>
              <a href={callHref} className="premium-button-secondary">Call {clinicContact.primaryCallDisplay}</a>
            </div>
          </div>
          <aside className="rounded-[1.5rem] bg-teal-950 p-6 text-white sm:p-8">
            <h2 className="text-xl font-bold">What must be confirmed first</h2>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-teal-50/85">
              {checks.map((check) => (
                <li key={check} className="flex gap-3">
                  <span aria-hidden="true" className="text-teal-300">○</span>
                  {check}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
