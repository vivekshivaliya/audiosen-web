import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

type EnquiryRecord = {
  submittedAt: string;
  ipKey: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  language: string;
  serviceNeeded: string;
  preferredChannel: string;
  preferredCallbackTime: string;
  leadSource: string;
  message: string;
};

const dataDir = process.env.AUDIOSEN_DATA_DIR || path.join(process.cwd(), "data");
const enquiryLogPath = path.join(dataDir, "enquiries.ndjson");

export async function saveEnquiry(record: EnquiryRecord) {
  await mkdir(dataDir, { recursive: true });
  await appendFile(enquiryLogPath, `${JSON.stringify(record)}\n`, "utf8");
  return enquiryLogPath;
}
