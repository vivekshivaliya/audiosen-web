import type { NextRequest } from "next/server";
import { handleEnquiryPost } from "@/lib/enquiries/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return handleEnquiryPost(request, "canonical");
}
