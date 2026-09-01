import type { Metadata } from "next";
import Link from "next/link";
import { getActiveCatalogSnapshot } from "@/lib/catalog/runtime";
import { searchPublicContent } from "@/lib/search-index";

export const metadata: Metadata = {
  title: "Search Audiosen",
  description: "Search public Audiosen hearing-aid guides, services, articles and FAQs.",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (rawQuery ?? "").trim().slice(0, 80);
  const [results, catalogSnapshot] = await Promise.all([
    searchPublicContent(query),
    getActiveCatalogSnapshot(),
  ]);
  const hearingAidBrowsePath = catalogSnapshot
    ? "/hearing-aids"
    : "/hearing-aids-india";

  return (
    <main id="main-content" className="mx-auto min-h-[70svh] max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-16">
      <section className="rounded-[2rem] bg-teal-950 px-7 py-10 text-white sm:px-10">
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-300">Public content search</p>
        <h1 className="mt-3 font-display text-5xl font-semibold sm:text-6xl">Search Audiosen</h1>
        <p className="mt-4 max-w-2xl leading-7 text-teal-50/80">
          Search hearing-device guides, care services, speech pages, articles and public FAQs.
          Do not enter names, phone numbers, health records or other personal information.
        </p>
        <form action="/search" method="get" role="search" className="mt-7 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="site-search">Search public Audiosen content</label>
          <input
            id="site-search"
            name="q"
            type="search"
            defaultValue={query}
            maxLength={80}
            autoComplete="off"
            placeholder="Try “repair”, “speech” or “rechargeable”"
            className="min-h-12 flex-1 rounded-xl border border-white/30 bg-white px-4 text-slate-950 outline-none focus:ring-4 focus:ring-teal-300/40"
          />
          <button type="submit" className="premium-button-primary border-white bg-white text-teal-950">Search</button>
        </form>
      </section>

      <section aria-live="polite" aria-labelledby="search-results-title" className="py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="search-results-title" className="font-display text-4xl font-semibold text-slate-950">
            {query ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Start with a public topic"}
          </h2>
          {query ? <span className="text-sm text-slate-500">for “{query}”</span> : null}
        </div>

        {query && results.length === 0 ? (
          <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-7">
            <h3 className="text-xl font-bold text-slate-950">No public page matched that topic</h3>
            <p className="mt-2 leading-7 text-slate-600">Try a shorter general term or browse the main service and hearing-aid pages.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/services" className="premium-button-secondary">Browse Services</Link>
              <Link href={hearingAidBrowsePath} className="premium-button-secondary">Browse Hearing Aids</Link>
            </div>
          </div>
        ) : null}

        {results.length ? (
          <ol className="mt-8 grid gap-4 md:grid-cols-2">
            {results.map((result) => (
              <li key={result.href}>
                <article className="h-full rounded-[1.5rem] border border-slate-200 bg-white p-6">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700">{result.type}</span>
                  <h3 className="mt-3 text-xl font-bold text-slate-950">
                    <Link href={result.href} className="underline decoration-teal-200 underline-offset-4 hover:decoration-teal-700">
                      {result.title}
                    </Link>
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{result.description}</p>
                </article>
              </li>
            ))}
          </ol>
        ) : null}
      </section>
    </main>
  );
}
