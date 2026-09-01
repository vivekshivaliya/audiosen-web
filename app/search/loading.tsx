export default function SearchLoading() {
  return (
    <main aria-busy="true" className="mx-auto min-h-[70svh] max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <span className="sr-only">Loading search results…</span>
      <div className="h-72 animate-pulse rounded-[2rem] bg-teal-950 motion-reduce:animate-none" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-[1.5rem] border border-slate-200 bg-white motion-reduce:animate-none" />
        ))}
      </div>
    </main>
  );
}
