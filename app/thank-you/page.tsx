import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ConsumeThankYouContext } from "@/components/consume-thank-you-context";
import {
  AUDIOSEN_PHONE_DISPLAY,
  AUDIOSEN_PHONE_E164,
  AUDIOSEN_WHATSAPP_URL,
} from "@/lib/enquiries/constants";
import {
  THANK_YOU_COOKIE,
  verifyThankYouContextToken,
} from "@/lib/enquiries/thank-you-context";
import { isCatalogStagingPreviewEnabled } from "@/lib/catalog/launch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Thank You | Audiosen",
  description: "Your Audiosen hearing-care request has been received.",
  robots: { index: false, follow: false },
};

const carePlanLabels: Record<string, string> = {
  "care-plan-3-months": "3 Months Care Plan",
  "care-plan-6-months": "6 Months Care Plan",
  "care-plan-12-months": "12 Months Care Plan",
};

export default async function ThankYouPage() {
  const cookieStore = await cookies();
  const context = verifyThankYouContextToken(cookieStore.get(THANK_YOU_COOKIE)?.value);
  const hearingAidBrowsePath = isCatalogStagingPreviewEnabled()
    ? "/hearing-aids"
    : "/hearing-aids-india";
  const carePlan = context ? carePlanLabels[context.service] : undefined;

  return (
    <main className="relative mx-auto min-h-[70vh] max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
      <ConsumeThankYouContext />
      <section className="premium-shell mx-auto max-w-3xl overflow-hidden p-7 text-center sm:p-12">
        <div
          className="sonic-success-orb mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-4xl text-emerald-700 shadow-[0_18px_50px_rgba(5,150,105,0.2)]"
          aria-hidden="true"
        >
          <span>✓</span>
        </div>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.24em] text-sky-700">
          Request received
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-slate-950 sm:text-5xl">
          Thank You for Choosing Audiosen
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
          Your request has been received successfully. Our team will review your details and contact you.
        </p>

        {context ? (
          <dl className="mx-auto mt-8 grid max-w-xl gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-5 text-left sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Reference</dt>
              <dd className="mt-1 font-semibold text-slate-950">{context.reference}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Service</dt>
              <dd className="mt-1 font-semibold text-slate-950">{context.selectedDevice || carePlan || context.service}</dd>
            </div>
          </dl>
        ) : (
          <p className="mx-auto mt-8 max-w-xl rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-600">
            For privacy, enquiry details are shown only once immediately after submission.
          </p>
        )}

        {carePlan ? (
          <p className="mx-auto mt-5 max-w-xl rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm leading-6 text-teal-950">
            Your enquiry is for the <strong>{carePlan}</strong>. The team will confirm suitability, included support and written offline terms before any payment.
          </p>
        ) : null}

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <a className="premium-button-primary" href={`tel:${AUDIOSEN_PHONE_E164}`}>
            Call {AUDIOSEN_PHONE_DISPLAY}
          </a>
          <a className="premium-button-secondary" href={AUDIOSEN_WHATSAPP_URL} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <Link className="premium-button-secondary" href={hearingAidBrowsePath}>
            Explore Hearing Aids
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-5 text-sm font-semibold text-sky-800">
          <Link href="/contact">Book another service</Link>
          <Link href="/">Return home</Link>
        </div>
      </section>
    </main>
  );
}
