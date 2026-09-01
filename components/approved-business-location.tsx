import {
  AUDIOSEN_ADDRESS,
  AUDIOSEN_MAPS_URL,
} from "@/lib/enquiries/constants";
import { getCanonicalOrganizationJsonLd } from "@/lib/business-profile";
import { StructuredData } from "@/lib/structured-data";

export async function ApprovedLocalBusinessStructuredData() {
  return <StructuredData data={await getCanonicalOrganizationJsonLd()} />;
}

export async function ApprovedBusinessProfileCopy({
  inverse = false,
  compact = false,
}: {
  inverse?: boolean;
  compact?: boolean;
} = {}) {
  return (
    <div className={`${compact ? "mt-2 space-y-2 text-sm" : "mt-5 space-y-4"} ${inverse ? "text-slate-300" : "text-slate-700"}`}>
      <address className="not-italic leading-7">
        <strong className={`block ${inverse ? "text-white" : "text-slate-950"}`}>Clinic address</strong>
        {AUDIOSEN_ADDRESS}
      </address>
      <p className={`text-sm leading-6 ${inverse ? "text-slate-400" : "text-slate-600"}`}>
        Please call before travelling to confirm the most suitable service and appointment time.
      </p>
    </div>
  );
}

export async function ApprovedBusinessDirectionsCard() {
  return (
    <div className="w-full max-w-md rounded-[1.75rem] border border-white/40 bg-white/85 p-7 text-left shadow-xl backdrop-blur">
      <h3 className="text-xl font-bold text-slate-950">Visit Audiosen</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{AUDIOSEN_ADDRESS}</p>
      <a href={AUDIOSEN_MAPS_URL} target="_blank" rel="noopener noreferrer" className="premium-button-primary mt-5" data-analytics-event="google_directions_click" data-analytics-location="home_contact">Get directions</a>
    </div>
  );
}
