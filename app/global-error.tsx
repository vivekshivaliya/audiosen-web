"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ margin: 0, background: "#edf6f5", color: "#0b2431", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1.5rem" }}>
          <section style={{ maxWidth: "42rem", border: "1px solid #d4e5e6", borderRadius: "2rem", background: "white", padding: "2.5rem", textAlign: "center" }}>
            <h1 style={{ margin: 0, fontSize: "2rem" }}>Audiosen is temporarily unavailable</h1>
            <p style={{ lineHeight: 1.7, color: "#49626d" }}>
              Please try once more. If the problem continues, call 8923092563. No technical details
              or patient information are displayed here.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{ minHeight: "44px", border: 0, borderRadius: "999px", background: "#07525d", color: "white", padding: ".75rem 1.25rem", fontWeight: 700, cursor: "pointer" }}
            >
              Try Again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
