"use client";

import Link from "next/link";
import { type CSSProperties, type KeyboardEvent, useRef, useState } from "react";
import { earAnatomyDataUri } from "@/components/ear-anatomy-image";

type EarPart = "outer" | "canal" | "middle" | "inner";

type EarPartDetail = {
  id: EarPart;
  label: string;
  shortLabel: string;
  description: string;
  journey: string;
  cue: string;
  focus: CSSProperties;
};

const parts: readonly EarPartDetail[] = [
  {
    id: "outer",
    label: "Outer ear",
    shortLabel: "Collect",
    description: "The pinna is the visible part of the ear. Its folds collect sound from around you and guide it toward the ear canal.",
    journey: "1. Collect",
    cue: "The outer ear helps gather sound; it does not determine whether someone has hearing loss.",
    focus: { left: "5%", top: "22%", width: "28%", height: "59%" },
  },
  {
    id: "canal",
    label: "Ear canal & eardrum",
    shortLabel: "Guide",
    description: "Sound travels through the ear canal to the eardrum. The eardrum responds to sound as a very small, controlled vibration.",
    journey: "2. Guide",
    cue: "Wax, irritation and infection can affect comfort or sound. A clinician can assess the cause safely.",
    focus: { left: "26%", top: "39%", width: "28%", height: "28%" },
  },
  {
    id: "middle",
    label: "Middle ear",
    shortLabel: "Transfer",
    description: "Behind the eardrum, three tiny bones—malleus, incus and stapes—transfer vibration toward the inner ear.",
    journey: "3. Transfer",
    cue: "This illustration simplifies very small structures. It is an education aid, not a diagnostic image.",
    focus: { left: "45%", top: "36%", width: "22%", height: "32%" },
  },
  {
    id: "inner",
    label: "Inner ear & nerve",
    shortLabel: "Convert",
    description: "The cochlea converts vibration into nerve signals. Those signals travel through the auditory nerve for the brain to interpret as sound.",
    journey: "4. Convert",
    cue: "Hearing tests help measure hearing ability; this model cannot show an individual’s hearing health.",
    focus: { left: "60%", top: "19%", width: "31%", height: "62%" },
  },
] as const;

function AnatomyVisual({ selected }: { selected: EarPartDetail }) {
  return (
    <div className="relative min-h-[22rem] overflow-hidden rounded-[1.5rem] bg-[#dff2ef] sm:min-h-[28rem]">
      <div
        role="img"
        aria-label="Illustrative 3D cutaway of the outer, middle and inner ear, including the ear canal, eardrum, ossicles, cochlea and auditory nerve."
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${earAnatomyDataUri})` }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(7,44,52,.13),transparent_36%,transparent_72%,rgba(255,255,255,.1))]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full border-2 border-white bg-teal-200/20 shadow-[0_0_0_7px_rgba(13,148,136,.18),0_0_34px_rgba(13,148,136,.38)] transition-all duration-500 motion-reduce:transition-none"
        style={selected.focus}
      />
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/70 bg-white/90 px-3 py-2.5 text-xs shadow-sm backdrop-blur sm:left-5 sm:right-5">
        <span className="font-bold text-teal-950">{selected.journey} · {selected.label}</span>
        <span className="font-semibold text-slate-600">Illustrative 3D anatomy model</span>
      </div>
    </div>
  );
}

export function EarEducation() {
  const [selectedId, setSelectedId] = useState<EarPart>("outer");
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = parts.find((part) => part.id === selectedId) ?? parts[0];

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + parts.length) % parts.length;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % parts.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = parts.length - 1;
    setSelectedId(parts[nextIndex].id);
    buttonRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
      <section aria-label="Interactive ear anatomy illustration" className="relative overflow-hidden rounded-[1.75rem] border border-teal-900/10 bg-[#eaf8f5] p-3 shadow-[0_30px_70px_-45px_rgba(8,59,69,.6)] sm:p-5">
        <AnatomyVisual selected={selected} />
        <p className="px-2 pb-1 pt-4 text-xs leading-5 text-slate-600">
          A realistic educational cutaway to explain the sound pathway. Structures are illustrative and not to scale.
        </p>
      </section>

      <div>
        <p className="premium-eyebrow">Hearing education</p>
        <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">Follow sound from the outside in</h2>
        <p className="mt-4 max-w-xl leading-7 text-slate-600">
          Choose a part of the ear to follow the journey of sound. This realistic anatomy illustration supports learning—it cannot diagnose a condition or replace a hearing assessment.
        </p>

        <div role="tablist" aria-label="Parts of the ear" className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {parts.map((part, index) => (
            <button
              key={part.id}
              ref={(element) => { buttonRefs.current[index] = element; }}
              type="button"
              role="tab"
              id={`ear-tab-${part.id}`}
              aria-controls="ear-part-panel"
              aria-selected={selectedId === part.id}
              tabIndex={selectedId === part.id ? 0 : -1}
              onClick={() => setSelectedId(part.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={`min-h-14 rounded-xl border px-3 py-2 text-left text-sm font-bold transition ${selectedId === part.id ? "border-teal-800 bg-teal-900 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-teal-400"}`}
            >
              <span className="block text-[10px] uppercase tracking-[.12em] opacity-[.72]">{part.journey}</span>
              <span className="mt-0.5 block">{part.label}</span>
            </button>
          ))}
        </div>

        <div id="ear-part-panel" role="tabpanel" aria-labelledby={`ear-tab-${selected.id}`} className="mt-3 rounded-2xl border border-teal-200 bg-teal-50 p-5">
          <h3 className="font-bold text-teal-950">{selected.label}: {selected.shortLabel} sound</h3>
          <p className="mt-2 text-sm leading-7 text-teal-950/80">{selected.description}</p>
          <p className="mt-3 border-t border-teal-200 pt-3 text-xs leading-5 text-teal-950/70"><span className="font-bold">Helpful context:</span> {selected.cue}</p>
        </div>

        <ol aria-label="The sound journey" className="mt-5 grid gap-2 sm:grid-cols-2">
          {parts.map((part) => (
            <li key={part.id} className={`rounded-xl border px-3 py-2 text-sm ${selectedId === part.id ? "border-amber-300 bg-amber-50 text-amber-950" : "border-slate-200 bg-white text-slate-600"}`}>
              <span className="font-bold">{part.journey}</span> <span aria-hidden="true">→</span> {part.shortLabel} sound
            </li>
          ))}
        </ol>
        <Link href="/book-consultation?service=hearing-assessment" className="premium-button-primary mt-6">Concerned About Your Hearing? Book Assessment</Link>
      </div>
    </div>
  );
}
