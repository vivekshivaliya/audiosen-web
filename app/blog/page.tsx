import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";

const blogIndex = [
  {
    href: "#annual-checkup",
    title: "The Importance of Regular Hearing Check-ups",
  },
  {
    href: "#hearing-aid-signs",
    title: "5 Signs You Might Need Hearing Aids",
  },
  {
    href: "#noise-protection",
    title: "Protecting Your Ears in a Noisy World",
  },
  {
    href: "#family-conversation",
    title: "How to Talk to a Loved One About Hearing Loss",
  },
  {
    href: "#future-technology",
    title: "The Future of Hearing Technology",
  },
];

const hearingAidSigns = [
  {
    sign: "1. Turning up the TV",
    detail: "Family members complain the volume is too loud.",
  },
  {
    sign: "2. Difficulty in noisy places",
    detail: "Restaurants or gatherings become exhausting to follow.",
  },
  {
    sign: "3. Often asking \"What?\"",
    detail: "You frequently need people to repeat themselves.",
  },
  {
    sign: "4. Ringing in the ears",
    detail: "Persistent tinnitus, especially at night.",
  },
  {
    sign: "5. Withdrawing from social life",
    detail: "You avoid calls or group events because hearing feels like a chore.",
  },
];

const decibelGuide = [
  {
    level: "60 dB",
    source: "Normal conversation",
    impact: "Safe",
    impactClass: "bg-emerald-100 text-emerald-700",
  },
  {
    level: "80-85 dB",
    source: "Heavy traffic / restaurant",
    impact: "Risk after 8 hours",
    impactClass: "bg-amber-100 text-amber-700",
  },
  {
    level: "95 dB",
    source: "Lawnmower / motorcycle",
    impact: "Damage after 1 hour",
    impactClass: "bg-orange-100 text-orange-700",
  },
  {
    level: "110 dB",
    source: "Rock concert / sporting event",
    impact: "Damage after 5 minutes",
    impactClass: "bg-rose-100 text-rose-700",
  },
  {
    level: "140+ dB",
    source: "Fireworks / gunshot",
    impact: "Immediate harm",
    impactClass: "bg-red-100 text-red-700",
  },
];

export const metadata: Metadata = {
  title: "Audiosen Blog | Hearing Health Tips, Care Guides & Technology",
  description:
    "Explore Audiosen's latest hearing health articles, practical care guides, and technology updates to help you hear better and live confidently.",
  alternates: {
    canonical: "/blog",
  },
};

const postCardClass =
  "rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_48px_-30px_rgba(8,68,119,0.45)] sm:p-8";

export default function BlogPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <Reveal>
        <section className="relative overflow-hidden rounded-[2rem] border border-sky-100 bg-gradient-to-br from-[#eff7ff] via-white to-[#ebfdf8] p-7 sm:p-10">
          <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-sky-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-teal-200/35 blur-3xl" />
          <p className="inline-flex rounded-full border border-sky-200 bg-white/80 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-800">
            Audiosen Hearing Blog
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-4xl leading-tight text-slate-900 sm:text-5xl">
            Trusted hearing guidance for patients and families
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-700 sm:text-lg">
            Explore practical hearing care advice, early warning signs, prevention tips, family
            communication guidance, and the latest hearing technology updates - all in one place.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {blogIndex.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-800"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      <div className="mt-10 space-y-8">
        <Reveal delay={0.03}>
          <article id="annual-checkup" className={postCardClass}>
            <div className="grid items-start gap-7 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
                  Blog Post 1
                </p>
                <h2 className="mt-3 font-display text-3xl text-slate-900 sm:text-4xl">
                  The Importance of Regular Hearing Check-ups
                </h2>
                <p className="mt-2 text-lg font-semibold text-slate-700">
                  Why your ears deserve annual attention
                </p>
                <p className="mt-5 text-base leading-relaxed text-slate-700">
                  Most of us get our eyes tested regularly and visit the dentist twice a year, but
                  hearing checks are often delayed. Hearing loss usually develops gradually, and by
                  the time it becomes obvious, it may already be affecting your daily confidence
                  and communication.
                </p>

                <ul className="mt-5 space-y-3 text-sm leading-relaxed text-slate-700 sm:text-base">
                  <li className="rounded-xl border border-sky-100 bg-sky-50/70 p-3">
                    <strong>Early detection prevents further decline:</strong> if hearing loss is
                    identified early, it can often be managed more effectively. Waiting too long
                    may reduce the brain&apos;s ability to process speech clearly.
                  </li>
                  <li className="rounded-xl border border-sky-100 bg-sky-50/70 p-3">
                    <strong>Better long-term brain health:</strong> untreated hearing loss is
                    linked with higher risk of cognitive decline. Staying connected to
                    conversations keeps your brain active.
                  </li>
                  <li className="rounded-xl border border-sky-100 bg-sky-50/70 p-3">
                    <strong>Stronger relationships:</strong> hearing clearly reduces frustration
                    for both you and your loved ones, making conversations effortless again.
                  </li>
                </ul>

                <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50/65 p-4 sm:p-5">
                  <h3 className="text-xl font-semibold text-slate-900">
                    What to expect at an Audiosen hearing check
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700 sm:text-base">
                    <li>A painless 30-minute test in a sound-treated room.</li>
                    <li>A detailed audiogram showing your hearing thresholds.</li>
                    <li>
                      Personalised advice for hearing aids, follow-ups, or ear protection tips.
                    </li>
                  </ul>
                </div>

                <Link
                  href="/#contact"
                  className="mt-6 inline-flex rounded-full bg-sky-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
                >
                  Book a free, no-obligation hearing screening
                </Link>
              </div>

              <div>
                <Image
                  src="/images/contact-audiologist-doctor.jpg"
                  alt="Audiologist performing a hearing check-up for a patient"
                  width={1200}
                  height={760}
                  className="h-auto w-full rounded-[1.5rem] border border-slate-200 object-cover"
                />
              </div>
            </div>
          </article>
        </Reveal>

        <Reveal delay={0.06}>
          <article id="hearing-aid-signs" className={postCardClass}>
            <div className="grid items-start gap-7 lg:grid-cols-[1fr_1.15fr]">
              <div className="order-last lg:order-first">
                <Image
                  src="/images/products/real-oticon-top-view.jpg"
                  alt="Modern hearing aid being held during a fitting discussion"
                  width={1200}
                  height={760}
                  className="h-auto w-full rounded-[1.5rem] border border-slate-200 object-cover"
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
                  Blog Post 2
                </p>
                <h2 className="mt-3 font-display text-3xl text-slate-900 sm:text-4xl">
                  5 Signs You Might Need Hearing Aids (and Why There&apos;s Nothing to Fear)
                </h2>
                <p className="mt-2 text-lg font-semibold text-slate-700">
                  Don&apos;t ignore these silent signals
                </p>
                <p className="mt-5 text-base leading-relaxed text-slate-700">
                  Many people wait 7 to 10 years before seeking help. Stigma and denial are common,
                  but identifying early signs can change everything. A professional opinion gives
                  you clarity, options, and peace of mind.
                </p>

                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-sm sm:text-base">
                    <thead className="bg-sky-50 text-slate-900">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Sign</th>
                        <th className="px-4 py-3 font-semibold">What you might notice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {hearingAidSigns.map((item) => (
                        <tr key={item.sign}>
                          <td className="px-4 py-3 font-semibold text-slate-900">{item.sign}</td>
                          <td className="px-4 py-3">{item.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 sm:p-5">
                  <h3 className="text-xl font-semibold text-slate-900">
                    The good news: modern hearing aids are smarter than ever
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700 sm:text-base">
                    <li>Invisible in-the-canal designs.</li>
                    <li>Bluetooth streaming for calls, videos, and music.</li>
                    <li>Rechargeable batteries for easy daily use.</li>
                  </ul>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
                    Audiosen offers a 30-day trial so you can experience benefits without pressure.
                  </p>
                </div>

                <Link
                  href="/#hearingtest"
                  className="mt-6 inline-flex rounded-full bg-sky-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
                >
                  Take our 2-minute online hearing screener
                </Link>
              </div>
            </div>
          </article>
        </Reveal>

        <Reveal delay={0.09}>
          <article id="noise-protection" className={postCardClass}>
            <div className="grid items-start gap-7 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
                  Blog Post 3
                </p>
                <h2 className="mt-3 font-display text-3xl text-slate-900 sm:text-4xl">
                  Protecting Your Ears in a Noisy World - A Practical Guide
                </h2>
                <p className="mt-2 text-lg font-semibold text-slate-700">
                  From concerts to power tools: prevent noise-induced hearing loss
                </p>
                <p className="mt-5 text-base leading-relaxed text-slate-700">
                  Noise-induced hearing loss is fully preventable, yet still common at work and in
                  daily life. Small habits can protect your ears for the long term.
                </p>

                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-sm sm:text-base">
                    <thead className="bg-sky-50 text-slate-900">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Reference level</th>
                        <th className="px-4 py-3 font-semibold">Common source</th>
                        <th className="px-4 py-3 font-semibold">Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {decibelGuide.map((item) => (
                        <tr key={item.level}>
                          <td className="px-4 py-3 font-semibold text-slate-900">{item.level}</td>
                          <td className="px-4 py-3">{item.source}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${item.impactClass}`}>
                              {item.impact}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 className="mt-6 text-xl font-semibold text-slate-900">
                  3 easy ways to protect your hearing
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700 sm:text-base">
                  <li>
                    <strong>Use the 60/60 rule:</strong> no more than 60% volume for 60 minutes at
                    a time with headphones.
                  </li>
                  <li>
                    <strong>Wear earplugs at loud events:</strong> high-fidelity earplugs preserve
                    sound quality while reducing harmful intensity.
                  </li>
                  <li>
                    <strong>Give your ears quiet breaks:</strong> after about 15 minutes of loud
                    noise, rest in silence for 10 minutes.
                  </li>
                </ul>

                <p className="mt-4 text-sm leading-relaxed text-slate-700 sm:text-base">
                  Audiosen also offers custom moulded earplugs for musicians, swimmers, and
                  industrial workers - reusable, comfortable, and more effective than basic foam
                  plugs.
                </p>

                <Link
                  href="/#contact"
                  className="mt-6 inline-flex rounded-full bg-sky-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
                >
                  Order custom earplugs or book a fitting
                </Link>
              </div>

              <div>
                <Image
                  src="/images/blog/noise-protection-guide.svg"
                  alt="Noise protection guide illustration with hearing safety tips"
                  width={1200}
                  height={760}
                  className="h-auto w-full rounded-[1.5rem] border border-slate-200 object-cover"
                />
              </div>
            </div>
          </article>
        </Reveal>

        <Reveal delay={0.12}>
          <article id="family-conversation" className={postCardClass}>
            <div className="grid items-start gap-7 lg:grid-cols-[1fr_1.15fr]">
              <div className="order-last lg:order-first">
                <Image
                  src="/images/contact-audiologist-doctor-hq.jpg"
                  alt="Supportive hearing care visit for a child and family"
                  width={1200}
                  height={760}
                  className="h-auto w-full rounded-[1.5rem] border border-slate-200 object-cover"
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
                  Blog Post 4
                </p>
                <h2 className="mt-3 font-display text-3xl text-slate-900 sm:text-4xl">
                  How to Talk to a Loved One About Their Hearing Loss
                </h2>
                <p className="mt-2 text-lg font-semibold text-slate-700">
                  A guide for family members, with kindness
                </p>
                <p className="mt-5 text-base leading-relaxed text-slate-700">
                  Hearing conversations can feel sensitive. Gentle support often works better than
                  pressure. The goal is to make your loved one feel supported, not judged.
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                    <h3 className="text-lg font-semibold text-emerald-800">Do&apos;s</h3>
                    <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
                      <li>Choose a calm, private time to talk.</li>
                      <li>
                        Use &quot;I&quot; statements such as, &quot;I feel worried when you miss
                        important calls.&quot;
                      </li>
                      <li>
                        Offer partnership: &quot;Let&apos;s both get our hearing checked at
                        Audiosen.&quot;
                      </li>
                      <li>Focus on positive outcomes like easier family dinners.</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
                    <h3 className="text-lg font-semibold text-rose-800">Don&apos;ts</h3>
                    <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
                      <li>Do not shout or raise your voice aggressively.</li>
                      <li>Do not compare them to others.</li>
                      <li>Do not expect immediate acceptance after one discussion.</li>
                    </ul>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-relaxed text-slate-700 sm:text-base">
                  Audiosen welcomes family members during consultations. We explain the audiogram
                  live, demonstrate devices, and answer questions together so everyone feels
                  informed.
                </p>

                <Link
                  href="/#contact"
                  className="mt-6 inline-flex rounded-full bg-sky-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
                >
                  Schedule a free family hearing awareness session
                </Link>
              </div>
            </div>
          </article>
        </Reveal>

        <Reveal delay={0.15}>
          <article id="future-technology" className={postCardClass}>
            <div className="grid items-start gap-7 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
                  Blog Post 5
                </p>
                <h2 className="mt-3 font-display text-3xl text-slate-900 sm:text-4xl">
                  The Future of Hearing Technology - What&apos;s New in 2025?
                </h2>
                <p className="mt-2 text-lg font-semibold text-slate-700">
                  AI, smart apps, and invisible hearing aids
                </p>
                <p className="mt-5 text-base leading-relaxed text-slate-700">
                  Hearing technology is evolving rapidly, and Audiosen keeps you updated with the
                  latest practical innovations that can improve comfort and clarity.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
                      Breakthrough 1
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">Adaptive AI</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      Modern hearing aids learn your listening environments and auto-adjust to
                      reduce manual control.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
                      Breakthrough 2
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">Phone Connectivity</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      Premium models now connect directly with iPhone and Android for calls,
                      podcasts, and meetings.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
                      Breakthrough 3
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">Self-fitting Apps</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      Many devices now allow personal tuning of volume, tone, and directionality
                      from a companion app.
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50/70 p-4 sm:p-5">
                  <h3 className="text-xl font-semibold text-slate-900">Audiosen&apos;s commitment</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">
                    We provide the latest solutions from Phonak, Oticon, and Signia, plus our own
                    value-focused range. Every purchase includes a 60-day happiness guarantee and
                    free firmware updates.
                  </p>
                </div>

                <Link
                  href="/#contact"
                  className="mt-6 inline-flex rounded-full bg-sky-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
                >
                  Request a free in-home AI hearing aid demo if you&apos;re really interested in
                  our services.
                </Link>
              </div>

              <div>
                <Image
                  src="/images/products/official/signia-ix.jpg"
                  alt="Advanced hearing aid technology product photo"
                  width={1200}
                  height={760}
                  className="h-auto w-full rounded-[1.5rem] border border-slate-200 bg-white object-cover"
                />
              </div>
            </div>
          </article>
        </Reveal>
      </div>
    </main>
  );
}
