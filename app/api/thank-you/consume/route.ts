import { NextResponse } from "next/server";
import { THANK_YOU_COOKIE } from "@/lib/enquiries/thank-you-context";

export async function POST() {
  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
  response.cookies.set(THANK_YOU_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/thank-you",
    maxAge: 0,
  });
  return response;
}
