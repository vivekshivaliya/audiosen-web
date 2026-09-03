"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body className="m-0 bg-[#edf6f5] font-sans text-[#0b2431]">
        <main className="grid min-h-screen place-items-center p-6">
          <section className="max-w-2xl rounded-[2rem] border border-[#d4e5e6] bg-white p-10 text-center">
            <h1 className="m-0 text-3xl">Audiosen is temporarily unavailable</h1>
            <p className="leading-7 text-[#49626d]">
              Please try once more. If the problem continues, call 8923092563. No technical details
              or patient information are displayed here.
            </p>
            <button
              type="button"
              onClick={reset}
              className="min-h-11 cursor-pointer rounded-full border-0 bg-[#07525d] px-5 py-3 font-bold text-white"
            >
              Try Again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
