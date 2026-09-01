"use client";

import { useEffect, useRef } from "react";
import {
  readAnalyticsConsent,
  subscribeToAnalyticsConsent,
  trackEvent,
} from "@/lib/analytics";

type ModelViewAnalyticsProps = {
  brandSlug: string;
  productSlug: string;
};

export function ModelViewAnalytics({ brandSlug, productSlug }: ModelViewAnalyticsProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    function tryTrack() {
      if (trackedRef.current || readAnalyticsConsent() !== "granted") return;

      trackEvent("hearing_aid_view", {
        brand_slug: brandSlug,
        product_slug: productSlug,
        page_type: "hearing_aid_model",
        page_path: window.location.pathname,
      });
      trackedRef.current = true;
    }

    tryTrack();
    return subscribeToAnalyticsConsent(tryTrack);
  }, [brandSlug, productSlug]);

  return null;
}

export function FinderCompletionAnalytics() {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const form = markerRef.current?.closest("form");
    if (!form) return;

    function onSubmit() {
      trackEvent("hearing_aid_finder_complete", {
        journey: "preference_finder",
        page_type: "hearing_aid_finder",
        page_path: window.location.pathname,
      });
    }

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);

  return <span ref={markerRef} hidden aria-hidden="true" />;
}
