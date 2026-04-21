import Navbar from "@/components/Navbar";
import { infoPages } from "@/lib/content";

export default function AboutPage() {
  const content = infoPages.about;

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white to-sky-50 p-8 shadow-[0_20px_50px_-35px_rgba(8,68,119,0.45)] sm:p-10">
          <p className="mb-4 inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-xs font-semibold tracking-wide text-sky-800">
            About Our Company
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            {content.title}
          </h1>

          <div className="mt-6 space-y-5 text-base leading-relaxed text-slate-700">
            {content.paragraphs.map((para) => (
              <p key={para}>{para}</p>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Our Mission</h2>
              <p className="mt-2 text-sm text-slate-600">
                To make hearing care simple, trustworthy, and accessible.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">What We Do</h2>
              <p className="mt-2 text-sm text-slate-600">
                Consultation, hearing tests, hearing aid sales, fitting, repair, and aftercare.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Who We Help</h2>
              <p className="mt-2 text-sm text-slate-600">
                Children, adults, seniors, and families needing hearing support.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}