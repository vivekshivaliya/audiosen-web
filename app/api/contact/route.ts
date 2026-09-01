import type { NextRequest } from "next/server";
import { handleEnquiryPost } from "@/lib/enquiries/http";

export const runtime = "nodejs";

/** Compatibility endpoint for the existing site form. New forms should use /api/enquiries. */
export async function POST(request: NextRequest) {
  return handleEnquiryPost(request, "contact-compatibility");
}
