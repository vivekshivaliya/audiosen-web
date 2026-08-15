"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { callHref, clinicContact, whatsappHref } from "@/lib/content";

export function MobileCtaBar() {
  return (
    <div className="sonic-mobile-cta fixed inset-x-0 bottom-0 z-[70] px-3 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2 lg:hidden">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-3 gap-2">
        <a href={callHref} className="premium-button-primary px-2 py-2.5 text-xs">
          Call
        </a>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="premium-button-secondary border-emerald-300 bg-emerald-50 px-2 py-2.5 text-xs text-emerald-800"
        >
          WhatsApp
        </a>
        <Link
          href="/#contact"
          className="premium-button-secondary px-2 py-2.5 text-xs"
          onClick={() =>
            trackEvent("cta_form_open", {
              cta_source: "mobile_sticky_bar",
              channel_priority: "call_whatsapp_form",
              clinic_call_number: clinicContact.primaryCallE164,
            })
          }
        >
          Form
        </Link>
      </div>
    </div>
  );
}
