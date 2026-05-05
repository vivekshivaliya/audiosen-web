"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

function getAnchorLabel(anchor: HTMLAnchorElement): string {
  const text = anchor.textContent?.trim();
  if (text && text.length > 0) return text;
  return anchor.getAttribute("aria-label") ?? "link";
}

export function AnalyticsClickTracker() {
  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const normalizedHref = href.toLowerCase();
      const baseParams = {
        link_url: href,
        link_text: getAnchorLabel(anchor),
        page_path: window.location.pathname,
      };

      if (normalizedHref.startsWith("tel:")) {
        trackEvent("click_call", baseParams);
        return;
      }

      if (normalizedHref.includes("wa.me") || normalizedHref.includes("whatsapp.com")) {
        trackEvent("click_whatsapp", baseParams);
      }
    }

    document.addEventListener("click", onDocumentClick);
    return () => {
      document.removeEventListener("click", onDocumentClick);
    };
  }, []);

  return null;
}
