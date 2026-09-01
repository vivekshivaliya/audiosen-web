"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" className="mx-auto grid min-h-[65svh] max-w-4xl place-items-center px-4 py-16 sm:px-6 lg:px-8">
      <section className="w-full rounded-[2rem] border border-rose-200 bg-white p-8 text-center sm:p-12">
        <span aria-hidden="true" className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-100 text-2xl text-rose-800">!</span>
        <h1 className="mt-6 font-display text-5xl font-semibold text-slate-950">Something interrupted this page</h1>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">
          Your browser has not been shown a technical stack trace. Try this page again or return
          home. If a form was being submitted, check for a reference before sending it again.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="premium-button-primary">Try Again</button>
          <Link href="/" className="premium-button-secondary">Return Home</Link>
        </div>
      </section>
    </main>
  );
}
