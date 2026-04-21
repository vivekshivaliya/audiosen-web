import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { SubscriptionPlan } from "@/lib/types";

type PaymentRecord = {
  verifiedAt: string;
  ipKey: string;
  planId: SubscriptionPlan["id"];
  planLabel: string;
  amountInr: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

const dataDir = path.join(process.cwd(), "data");
const paymentLogPath = path.join(dataDir, "payments.ndjson");

export async function savePaymentRecord(record: PaymentRecord) {
  await mkdir(dataDir, { recursive: true });
  await appendFile(paymentLogPath, `${JSON.stringify(record)}\n`, "utf8");
  return paymentLogPath;
}
