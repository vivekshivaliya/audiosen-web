"use client";

import { useState } from "react";
import type { SubscriptionPlan } from "@/lib/types";

const RAZORPAY_CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

type CreateOrderSuccess = {
  ok: true;
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  plan: {
    id: SubscriptionPlan["id"];
    label: string;
    priceInr: number;
  };
};

type VerifySuccess = {
  ok: true;
  message?: string;
};

type ApiFailure = {
  ok: false;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

type Notice = {
  tone: "success" | "error" | "info";
  message: string;
};

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
};

type RazorpayPaymentFailureResponse = {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", callback: (response: RazorpayPaymentFailureResponse) => void) => void;
};

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

function getErrorMessage(payload: ApiFailure): string {
  const firstFieldError = payload.fieldErrors
    ? Object.values(payload.fieldErrors).flat()[0]
    : null;

  return firstFieldError || payload.error || "Payment could not be processed right now.";
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector(
      `script[src="${RAZORPAY_CHECKOUT_SCRIPT}"]`,
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function SubscriptionCheckoutButton({ plan }: { plan: SubscriptionPlan }) {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function verifyPayment({
    planId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }: {
    planId: SubscriptionPlan["id"];
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const verifyResponse = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      }),
    });

    const verifyPayload = (await verifyResponse.json()) as VerifySuccess | ApiFailure;

    if (!verifyResponse.ok || !verifyPayload.ok) {
      setNotice({
        tone: "error",
        message: getErrorMessage(verifyPayload as ApiFailure),
      });
      return;
    }

    setNotice({
      tone: "success",
      message:
        verifyPayload.message ||
        "Payment successful. Our team will contact you for onboarding shortly.",
    });
  }

  async function onCheckoutClick() {
    setLoading(true);
    setNotice(null);

    try {
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });

      const orderPayload = (await orderResponse.json()) as CreateOrderSuccess | ApiFailure;

      if (!orderResponse.ok || !orderPayload.ok) {
        setNotice({
          tone: "error",
          message: getErrorMessage(orderPayload as ApiFailure),
        });
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        setNotice({
          tone: "error",
          message: "Unable to load secure checkout. Please refresh and try again.",
        });
        return;
      }

      const options: RazorpayOptions = {
        key: orderPayload.keyId,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        name: "Audiosen",
        description: `${plan.label} - INR ${plan.priceInr.toLocaleString("en-IN")}`,
        image: "/favicon.svg",
        order_id: orderPayload.orderId,
        handler: (response) => {
          void verifyPayment({
            planId: plan.id,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => {
            setNotice({
              tone: "info",
              message: "Checkout was closed. You can continue payment anytime.",
            });
          },
        },
        notes: {
          plan_id: plan.id,
          plan_label: plan.label,
        },
        theme: {
          color: "#0a5c9e",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", (response) => {
        setNotice({
          tone: "error",
          message:
            response.error?.description ||
            "Payment failed. Please try again with another method.",
        });
      });
      paymentObject.open();
    } catch {
      setNotice({
        tone: "error",
        message: "Network error while starting payment. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={onCheckoutClick}
        disabled={loading}
        className="inline-flex rounded-full bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? "Starting secure payment..." : "Pay & Subscribe"}
      </button>

      {notice ? (
        <p
          className={
            notice.tone === "success"
              ? "mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700"
              : notice.tone === "info"
                ? "mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800"
                : "mt-3 rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-700"
          }
        >
          {notice.message}
        </p>
      ) : null}
    </div>
  );
}
