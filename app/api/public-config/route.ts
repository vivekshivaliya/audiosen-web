import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * The Turnstile site key is designed to be public. Reading it at request time
 * lets Azure App Settings enable the widget without rebuilding the client.
 */
export async function GET() {
  const response = NextResponse.json({
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "",
  });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}
