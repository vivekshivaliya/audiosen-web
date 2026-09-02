"use client";

import Script from "next/script";
import { useCallback, useEffect, useId, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
          theme: "light";
          size: "flexible";
          appearance: "interaction-only";
          action: "enquiry_submit";
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export type TurnstileConfiguration = Readonly<{
  ready: boolean;
  configured: boolean;
}>;

export function TurnstileWidget({
  onTokenChange,
  resetKey = 0,
  onConfigurationChange,
}: {
  onTokenChange: (token: string) => void;
  resetKey?: number;
  onConfigurationChange?: (configuration: TurnstileConfiguration) => void;
}) {
  const reactId = useId();
  const containerId = `turnstile-${reactId.replace(/:/g, "")}`;
  const widgetIdRef = useRef<string | null>(null);
  const callbackRef = useRef(onTokenChange);
  const [scriptReady, setScriptReady] = useState(false);
  // Keep the server and initial client render identical. The public key is then
  // read from the runtime endpoint, so an Azure App Setting can be changed without
  // baking a value into the JavaScript bundle or causing a hydration mismatch.
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [configurationReady, setConfigurationReady] = useState(false);

  useEffect(() => {
    callbackRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    let active = true;
    void fetch("/api/public-config", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Public configuration unavailable");
        const payload = (await response.json()) as { turnstileSiteKey?: unknown };
        return typeof payload.turnstileSiteKey === "string" ? payload.turnstileSiteKey.trim() : "";
      })
      .then((key) => {
        if (active) setSiteKey(key);
      })
      .catch(() => {
        if (active) setSiteKey("");
      })
      .finally(() => {
        if (active) setConfigurationReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    onConfigurationChange?.({ ready: configurationReady, configured: Boolean(siteKey) });
  }, [configurationReady, onConfigurationChange, siteKey]);

  const renderWidget = useCallback(() => {
    if (!siteKey || !window.turnstile || widgetIdRef.current) return;
    const container = document.getElementById(containerId);
    if (!container) return;

    widgetIdRef.current = window.turnstile.render(container, {
      sitekey: siteKey,
      callback: (token) => callbackRef.current(token),
      "expired-callback": () => callbackRef.current(""),
      "error-callback": () => callbackRef.current(""),
      theme: "light",
      size: "flexible",
      appearance: "interaction-only",
      action: "enquiry_submit",
    });
  }, [containerId, siteKey]);

  useEffect(() => {
    if (!scriptReady) return;
    renderWidget();
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget, scriptReady]);

  useEffect(() => {
    if (!widgetIdRef.current || !window.turnstile) return;
    window.turnstile.reset(widgetIdRef.current);
    callbackRef.current("");
  }, [resetKey]);

  if (!configurationReady) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600">
        Loading bot verification…
      </p>
    );
  }

  if (!siteKey) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-950">
        Online form submissions are being protected with Cloudflare Turnstile and will activate
        once the clinic&apos;s verification keys are added.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <Script
        id="audiosen-turnstile-script"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        data-cfasync="false"
        onReady={() => setScriptReady(true)}
      />
      <div id={containerId} className="min-h-[65px]" role="group" aria-label="Bot verification" />
    </div>
  );
}
