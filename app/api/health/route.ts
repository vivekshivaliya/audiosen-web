import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function healthResponse() {
  const deployment =
    process.env.AUDIOSEN_STAGING_DEPLOYMENT === "true" ? "staging" : "production";
  return NextResponse.json(
    { ok: true, service: "audiosen-web", deployment },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}

export function GET() {
  return healthResponse();
}

export function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
