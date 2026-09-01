"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  analyticsAllowedOnCurrentPage,
  isAnalyticsEventName,
  isAnalyticsExcludedPath,
  pageHasNoindexDirective,
  trackEvent,
} from "@/lib/analytics";

export function AnalyticsClickTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (isAnalyticsExcludedPath(pathname) || pageHasNoindexDirective()) return;

    function onDocumentClick(event: MouseEvent) {
      if (!analyticsAllowedOnCurrentPage()) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const typedTarget = target.closest<HTMLElement>("[data-analytics-event]");
      const typedEvent = typedTarget?.dataset.analyticsEvent;
      if (typedTarget && typedEvent && isAnalyticsEventName(typedEvent)) {
        trackEvent(typedEvent, {
          cta_location: typedTarget.dataset.analyticsLocation ?? "unspecified",
          cta_source: "typed_click",
          page_path: window.location.pathname,
        });
        return;
      }

      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const normalizedHref = href.toLowerCase();
      const baseParams = {
        cta_location: anchor.dataset.analyticsLocation ?? "site_link",
        cta_source: "link_protocol",
        page_path: window.location.pathname,
      };

      if (normalizedHref.startsWith("tel:")) {
        trackEvent("call_click", baseParams);
        return;
      }

      if (normalizedHref.includes("wa.me") || normalizedHref.includes("whatsapp.com")) {
        trackEvent("whatsapp_click", baseParams);
        return;
      }

      if (normalizedHref.includes("google.com/maps") || normalizedHref.includes("maps.google")) {
        trackEvent("google_directions_click", baseParams);
        return;
      }

      if (normalizedHref === "/#contact" || normalizedHref.endsWith("#appointment")) {
        trackEvent("book_consultation", baseParams);
      }
    }

    document.addEventListener("click", onDocumentClick);
    return () => {
      document.removeEventListener("click", onDocumentClick);
    };
  }, [pathname]);

  return null;
}
