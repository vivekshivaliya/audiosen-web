import crypto from "node:crypto";
import { subscriptionPlans } from "@/lib/content";
import type { SubscriptionPlan } from "@/lib/types";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getRazorpayKeyId(): string {
  return requiredEnv("RAZORPAY_KEY_ID");
}

function getRazorpayKeySecret(): string {
  return requiredEnv("RAZORPAY_KEY_SECRET");
}

export function findSubscriptionPlan(id: string): SubscriptionPlan | undefined {
  return subscriptionPlans.find((plan) => plan.id === id);
}

export async function createRazorpayOrder(plan: SubscriptionPlan) {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const receipt = `audiosen_${plan.id}_${Date.now()}`;
  const amountInPaise = plan.priceInr * 100;

  const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        plan_id: plan.id,
        plan_label: plan.label,
      },
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as
    | RazorpayOrderResponse
    | { error?: { description?: string; code?: string } };

  if (!response.ok) {
    const message =
      "error" in payload && payload.error?.description
        ? payload.error.description
        : "Could not create payment order. Please try again.";
    throw new Error(message);
  }

  return payload as RazorpayOrderResponse;
}

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const hmac = crypto.createHmac("sha256", getRazorpayKeySecret());
  hmac.update(`${orderId}|${paymentId}`);
  const digest = hmac.digest("hex");

  const received = Buffer.from(signature, "utf8");
  const expected = Buffer.from(digest, "utf8");

  if (received.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(received, expected);
}
