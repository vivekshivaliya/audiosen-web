export function CatalogDisclosure({ mode = "preview" }: { mode?: "preview" | "published" }) {
  return (
    <aside className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-950">
      <strong>Model-guide boundary:</strong>{" "}
      {mode === "published"
        ? "These records passed Audiosen’s explicit database source, publication, and media-rights gates."
        : "These pages organise entries from Audiosen’s existing editorial catalogue in preview mode."}{" "}
      They do not confirm current stock, price, warranty, discount, trial availability, medical
      suitability, or final manufacturer specifications. Ask for current written information and
      use an appropriate assessment and fitting pathway before a device decision.
    </aside>
  );
}
