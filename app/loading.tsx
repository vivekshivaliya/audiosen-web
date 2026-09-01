export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Loading Audiosen content" className="mx-auto min-h-[65svh] max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <span className="sr-only">Loading…</span>
      <div className="animate-pulse motion-reduce:animate-none">
        <div className="h-5 w-44 rounded-full bg-teal-100" />
        <div className="mt-5 h-16 max-w-3xl rounded-2xl bg-slate-200" />
        <div className="mt-4 h-6 max-w-2xl rounded-xl bg-slate-100" />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-64 rounded-[1.5rem] border border-slate-200 bg-white">
              <div className="h-36 rounded-t-[1.5rem] bg-slate-100" />
              <div className="m-5 h-5 w-2/3 rounded bg-slate-200" />
              <div className="mx-5 h-4 w-5/6 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
