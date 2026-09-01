"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  analyticsAllowedOnCurrentPage,
  type AnalyticsConsentChoice,
  isAnalyticsExcludedPath,
  pageHasNoindexDirective,
  readAnalyticsConsent,
  saveAnalyticsConsent,
  subscribeToAnalyticsConsent,
} from "@/lib/analytics";

const googleAnalyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim() ?? "";
const analyticsConfigured = /^G-[A-Z0-9]+$/i.test(googleAnalyticsId);
type ConsentSnapshot = AnalyticsConsentChoice | null | "pending";

function getClientConsentSnapshot(): ConsentSnapshot {
  return readAnalyticsConsent();
}

function getServerConsentSnapshot(): ConsentSnapshot {
  return "pending";
}

function subscribeToRobotsMetadata(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.head, {
    attributes: true,
    attributeFilter: ["content"],
    childList: true,
    subtree: true,
  });
  return () => observer.disconnect();
}

function getClientNoindexSnapshot(): boolean {
  return pageHasNoindexDirective();
}

function getServerNoindexSnapshot(): boolean {
  return true;
}

function startGoogleAnalytics() {
  if (!analyticsConfigured || !analyticsAllowedOnCurrentPage()) return;
  if (document.getElementById("audiosen-google-analytics")) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };

  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  window.gtag("config", googleAnalyticsId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    send_page_view: false,
  });

  const pagePath = window.location.pathname || "/";
  window.gtag("event", "page_view", {
    page_location: `${window.location.origin}${pagePath}`,
    page_path: pagePath,
    page_title: document.title,
  });
  document.documentElement.dataset.audiosenAnalyticsPath = pagePath;

  const script = document.createElement("script");
  script.id = "audiosen-google-analytics";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
  script.dataset.cfasync = "false";
  document.head.appendChild(script);
}

export function AnalyticsConsent() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = usePathname();
  const choice = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    getClientConsentSnapshot,
    getServerConsentSnapshot,
  );
  const pageIsNoindex = useSyncExternalStore(
    subscribeToRobotsMetadata,
    getClientNoindexSnapshot,
    getServerNoindexSnapshot,
  );
  const analyticsDisabled =
    !analyticsConfigured || isAnalyticsExcludedPath(pathname) || pageIsNoindex;

  useEffect(() => {
    if (choice === "denied" || analyticsDisabled) {
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      if (analyticsDisabled) {
        delete document.documentElement.dataset.audiosenAnalyticsPath;
      }
      return;
    }

    if (choice !== "granted") return;

    window.gtag?.("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(startGoogleAnalytics, { timeout: 2500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timerId = globalThis.setTimeout(startGoogleAnalytics, 1500);
    return () => globalThis.clearTimeout(timerId);
  }, [analyticsDisabled, choice]);

  useEffect(() => {
    if (
      analyticsDisabled ||
      choice !== "granted" ||
      typeof window.gtag !== "function"
    ) {
      return;
    }
    if (document.documentElement.dataset.audiosenAnalyticsPath === pathname) return;

    window.gtag("event", "page_view", {
      page_location: `${window.location.origin}${pathname}`,
      page_path: pathname,
      page_title: document.title,
    });
    document.documentElement.dataset.audiosenAnalyticsPath = pathname;
  }, [analyticsDisabled, choice, pathname]);

  function chooseAnalytics(nextChoice: AnalyticsConsentChoice) {
    const previousChoice = choice;
    saveAnalyticsConsent(nextChoice);
    setSettingsOpen(false);

    if (previousChoice === "granted" && nextChoice === "denied") {
      window.location.reload();
    }
  }

  if (analyticsDisabled || choice === "pending") return null;

  if (choice !== null && !settingsOpen) {
    return (
      <button
        type="button"
        className="fixed bottom-24 left-3 z-[80] rounded-full border border-slate-300 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur lg:bottom-4"
        onClick={() => setSettingsOpen(true)}
      >
        Analytics settings
      </button>
    );
  }

  return (
    <aside
      aria-label="Analytics preference"
      className="fixed inset-x-4 bottom-24 z-[90] mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.55)] sm:p-5 lg:bottom-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-slate-700">
          Choose whether Audiosen may use optional, privacy-limited analytics to understand which
          pages help visitors. Advertising signals stay disabled. Read our{" "}
          <Link href="/privacy-policy" className="font-semibold text-sky-700 underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="premium-button-secondary px-4 py-2 text-sm"
            onClick={() => chooseAnalytics("denied")}
          >
            No thanks
          </button>
          <button
            type="button"
            className="premium-button-primary px-4 py-2 text-sm"
            onClick={() => chooseAnalytics("granted")}
          >
            Accept analytics
          </button>
        </div>
      </div>
    </aside>
  );
}
