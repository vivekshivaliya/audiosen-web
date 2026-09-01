import Link from "next/link";
import { callHref, clinicContact } from "@/lib/content";

export function NotFoundView() {
  return (
    <main id="main-content" className="mx-auto grid min-h-[70svh] max-w-5xl place-items-center px-4 py-16 sm:px-6 lg:px-8">
      <section className="w-full overflow-hidden rounded-[2rem] border border-teal-900/10 bg-white p-8 text-center shadow-[0_34px_90px_-54px_rgba(5,49,60,.7)] sm:p-12">
        <span aria-hidden="true" className="mx-auto grid h-20 w-20 place-items-center rounded-[1.5rem] bg-teal-950 font-display text-4xl font-semibold text-white">
          404
        </span>
        <p className="premium-eyebrow mt-7">This page moved or never existed</p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-slate-950">
          Let&apos;s get you back to the right care path
        </h1>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
          Try a service, browse hearing-device guides, or search Audiosen. No enquiry details have
          been lost or submitted from this page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="premium-button-primary">Return Home</Link>
          <Link href="/search" className="premium-button-secondary">Search Audiosen</Link>
          <a href={callHref} className="premium-button-secondary">Call {clinicContact.primaryCallDisplay}</a>
        </div>
      </section>
    </main>
  );
}
