"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FinderCompletionAnalytics } from "@/components/catalog/catalog-analytics";
import { CatalogModelCard } from "@/components/catalog/catalog-model-card";
import { ContextualEnquiryForm } from "@/components/catalog/contextual-enquiry-form";
import {
  finderPreferencesForEnquiry,
  finderScoringExclusions,
  isDirectlyVerifiedCatalogModel,
  parseFinderBudget,
  parseFinderCharging,
  parseFinderCurrentUser,
  parseFinderHomeVisit,
  parseFinderLifestyle,
  parseFinderStreaming,
  parseFinderVisibility,
  rankCatalogModelsForFinder,
  type FinderPreferences,
} from "@/lib/catalog/finder";
import {
  catalogStyleLabels,
  isCatalogBrandSlug,
  isCatalogDeviceStyle,
} from "@/lib/catalog/repository";
import { getSnapshotBrand } from "@/lib/catalog/snapshot";
import type { CatalogSnapshot } from "@/lib/catalog/types";

const pagePath = "/find-my-hearing-aid";

const lifestyleOptions = [
  { value: "conversation-groups", label: "Group conversations or meetings" },
  { value: "phone-media", label: "Phone calls, streaming, or media" },
  { value: "outdoors-active", label: "Outdoors or an active routine" },
  { value: "quiet-one-to-one", label: "Mostly quiet, one-to-one conversations" },
  { value: "mixed-routine", label: "A mixed daily routine" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

const budgetOptions = [
  { value: "under-50000", label: "Under ₹50,000" },
  { value: "50000-100000", label: "₹50,000–₹1,00,000" },
  { value: "100000-200000", label: "₹1,00,000–₹2,00,000" },
  { value: "over-200000", label: "Over ₹2,00,000" },
  { value: "not-sure", label: "Not sure / discuss first" },
] as const;

type FinderAnswers = {
  age: "" | "adult" | "child";
  currentUser: string;
  city: string;
  brand: string;
  style: string;
  charging: string;
  streaming: string;
  lifestyle: string;
  visibility: string;
  budget: string;
  homeVisit: string;
};

type CompletedFinder = {
  age: "adult" | "child";
  preferences: FinderPreferences;
  revision: number;
};

const initialAnswers: FinderAnswers = {
  age: "",
  currentUser: "",
  city: "",
  brand: "",
  style: "",
  charging: "",
  streaming: "",
  lifestyle: "",
  visibility: "",
  budget: "",
  homeVisit: "",
};

function preferencesFromAnswers(answers: FinderAnswers): FinderPreferences {
  const city = answers.city.trim().slice(0, 80);
  return {
    ...(isCatalogBrandSlug(answers.brand) ? { brand: answers.brand } : {}),
    ...(isCatalogDeviceStyle(answers.style) ? { style: answers.style } : {}),
    ...(parseFinderCurrentUser(answers.currentUser)
      ? { currentUser: parseFinderCurrentUser(answers.currentUser) }
      : {}),
    ...(parseFinderCharging(answers.charging)
      ? { charging: parseFinderCharging(answers.charging) }
      : {}),
    ...(parseFinderStreaming(answers.streaming)
      ? { streaming: parseFinderStreaming(answers.streaming) }
      : {}),
    ...(parseFinderLifestyle(answers.lifestyle)
      ? { lifestyle: parseFinderLifestyle(answers.lifestyle) }
      : {}),
    ...(parseFinderVisibility(answers.visibility)
      ? { visibility: parseFinderVisibility(answers.visibility) }
      : {}),
    ...(parseFinderBudget(answers.budget)
      ? { budget: parseFinderBudget(answers.budget) }
      : {}),
    ...(parseFinderHomeVisit(answers.homeVisit)
      ? { homeVisit: parseFinderHomeVisit(answers.homeVisit) }
      : {}),
    ...(city ? { city } : {}),
  };
}

function replaceWithCleanFinderUrl(fragment = ""): void {
  const cleanPath = `${window.location.pathname}${fragment}`;
  window.history.replaceState(window.history.state, "", cleanPath);
}

function focusAndScrollTo(id: string): void {
  const element = document.getElementById(id);
  if (!element) return;
  element.focus({ preventScroll: true });
  element.scrollIntoView?.({
    behavior:
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    block: "start",
  });
}

export function HearingAidFinder({ snapshot }: { snapshot: CatalogSnapshot }) {
  const [answers, setAnswers] = useState<FinderAnswers>(initialAnswers);
  const [completed, setCompleted] = useState<CompletedFinder | null>(null);

  useEffect(() => {
    // Remove legacy query-based finder state as soon as the client hydrates.
    // New submissions never create a query string in the first place.
    if (window.location.search) replaceWithCleanFinderUrl();
  }, []);

  const rankings = useMemo(
    () => completed?.age === "adult"
      ? rankCatalogModelsForFinder(completed.preferences, snapshot.models, snapshot.brands)
      : [],
    [completed, snapshot.brands, snapshot.models],
  );
  const scoringExclusions = completed
    ? finderScoringExclusions(completed.preferences)
    : [];
  const enquiryPreferences = completed
    ? finderPreferencesForEnquiry(completed.preferences)
    : {};
  const directlyVerifiedModelCount = snapshot.models.filter(
    isDirectlyVerifiedCatalogModel,
  ).length;

  function updateAnswer<Key extends keyof FinderAnswers>(
    key: Key,
    value: FinderAnswers[Key],
  ) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  function completeFinder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (answers.age !== "adult" && answers.age !== "child") return;
    setCompleted((current) => ({
      age: answers.age as "adult" | "child",
      preferences: preferencesFromAnswers(answers),
      revision: (current?.revision ?? 0) + 1,
    }));
    replaceWithCleanFinderUrl("#finder-results");
    window.requestAnimationFrame(() => {
      focusAndScrollTo("finder-results-heading");
    });
  }

  function startAgain() {
    setAnswers(initialAnswers);
    setCompleted(null);
    replaceWithCleanFinderUrl();
    window.requestAnimationFrame(() => {
      focusAndScrollTo("finder-form-heading");
    });
  }

  return (
    <>
      <section aria-labelledby="finder-form-heading" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <form action={pagePath} autoComplete="off" onSubmit={completeFinder} className="premium-section p-6 sm:p-8">
          <FinderCompletionAnalytics />
          <p className="premium-eyebrow">Your stated preferences</p>
          <h2 id="finder-form-heading" tabIndex={-1} className="mt-4 scroll-mt-32 font-display text-4xl font-semibold text-slate-900">Answer what you know</h2>
          <p className="premium-prose mt-3">
            “Not sure” and “no preference” are valid answers. Nothing is inferred from a skipped or unknown field.
          </p>

          <div className="mt-7 grid gap-6">
            <fieldset className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
              <legend className="px-2 text-sm font-bold text-slate-900">Path and current use</legend>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Who is this enquiry for?
                <select
                  required
                  value={answers.age}
                  onChange={(event) => updateAnswer("age", event.target.value as FinderAnswers["age"])}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="" disabled>Select an age pathway</option>
                  <option value="adult">Adult (18 or older)</option>
                  <option value="child">Child (under 18)</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Do they currently use a hearing aid?
                <select
                  required
                  value={answers.currentUser}
                  onChange={(event) => updateAnswer("currentUser", event.target.value)}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="" disabled>Select one</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="not-sure">Not sure</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                City (optional at this step)
                <input
                  type="text"
                  maxLength={80}
                  autoComplete="off"
                  value={answers.city}
                  onChange={(event) => updateAnswer("city", event.target.value)}
                  placeholder="Used for service-path discussion"
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                />
              </label>
            </fieldset>

            <fieldset className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
              <legend className="px-2 text-sm font-bold text-slate-900">Format and technology preferences</legend>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Brand
                <select
                  value={answers.brand}
                  onChange={(event) => updateAnswer("brand", event.target.value)}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="">No preference</option>
                  {snapshot.brands.map((brand) => <option key={brand.slug} value={brand.slug}>{brand.name}</option>)}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Physical style
                <select
                  value={answers.style}
                  onChange={(event) => updateAnswer("style", event.target.value)}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="">No preference</option>
                  {Object.entries(catalogStyleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Charging preference
                <select
                  required
                  value={answers.charging}
                  onChange={(event) => updateAnswer("charging", event.target.value)}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="" disabled>Select one</option>
                  <option value="rechargeable">Prefer rechargeable</option>
                  <option value="replaceable-battery">Prefer replaceable battery</option>
                  <option value="no-preference">No preference</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Streaming preference
                <select
                  required
                  value={answers.streaming}
                  onChange={(event) => updateAnswer("streaming", event.target.value)}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="" disabled>Select one</option>
                  <option value="important">Bluetooth/streaming is important</option>
                  <option value="not-needed">Streaming is not needed</option>
                  <option value="no-preference">No preference</option>
                </select>
              </label>
            </fieldset>

            <fieldset className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
              <legend className="px-2 text-sm font-bold text-slate-900">Daily-life preferences</legend>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Main listening routine
                <select
                  required
                  value={answers.lifestyle}
                  onChange={(event) => updateAnswer("lifestyle", event.target.value)}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="" disabled>Select one</option>
                  {lifestyleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Visibility and handling preference
                <select
                  required
                  value={answers.visibility}
                  onChange={(event) => updateAnswer("visibility", event.target.value)}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="" disabled>Select one</option>
                  <option value="discreet">Prefer a discreet appearance</option>
                  <option value="easy-to-handle">Prefer easier handling over discretion</option>
                  <option value="no-preference">No preference</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Budget band (preference only)
                <select
                  required
                  value={answers.budget}
                  onChange={(event) => updateAnswer("budget", event.target.value)}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="" disabled>Select one</option>
                  {budgetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </fieldset>

            <fieldset className="rounded-2xl border border-slate-200 bg-white p-5">
              <legend className="px-2 text-sm font-bold text-slate-900">Service preference</legend>
              <label className="grid max-w-md gap-2 text-sm font-semibold text-slate-700">
                Would a home visit be preferred?
                <select
                  required
                  value={answers.homeVisit}
                  onChange={(event) => updateAnswer("homeVisit", event.target.value)}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="" disabled>Select one</option>
                  <option value="yes">Yes, if available</option>
                  <option value="no">No</option>
                  <option value="not-sure">Not sure</option>
                </select>
              </label>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                This records a preference only. It does not confirm a service area, appointment, fee, or availability.
              </p>
            </fieldset>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="submit" className="premium-button-primary">Complete the preference path</button>
            <button type="button" onClick={startAgain} className="premium-button-secondary">Start again</button>
          </div>
        </form>
      </section>

      <section id="finder-results" aria-labelledby="finder-results-heading" className="scroll-mt-32 py-12">
        <p className="sr-only" role="status" aria-live="polite">
          {completed?.age === "child"
            ? "Pediatric clinical pathway shown. No products were ranked."
            : completed?.age === "adult"
              ? `${rankings.length} evidence-safe model results shown.`
              : ""}
        </p>
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {completed?.age === "child" ? (
            <div id="pediatric-path" className="scroll-mt-32">
              <div className="premium-shell p-6 sm:p-9">
                <p className="premium-eyebrow">Pediatric pathway</p>
                <h2 id="finder-results-heading" tabIndex={-1} className="mt-4 font-display text-4xl font-semibold text-slate-900">Use an age-appropriate clinical pathway</h2>
                <p className="premium-prose mt-4 max-w-4xl">
                  The product-ranking path stops here for anyone under 18. A child&apos;s pathway should
                  begin with pediatric hearing assessment and qualified clinical guidance, with
                  medical referral where indicated. The preferences can be included in a protected
                  enquiry, but no device is scored or ranked.
                </p>
                <ul className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                  <li className="premium-card p-4">Ask what age-appropriate assessment is needed.</li>
                  <li className="premium-card p-4">Share developmental, school, and communication concerns with a clinician.</li>
                  <li className="premium-card p-4">Confirm who will fit, verify, and review any recommended device.</li>
                  <li className="premium-card p-4">Seek prompt medical care for sudden loss, pain, discharge, injury, or severe dizziness.</li>
                </ul>
              </div>

              <div className="mt-9 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
                <div>
                  <p className="premium-eyebrow">Pediatric enquiry</p>
                  <h2 className="mt-4 font-display text-4xl font-semibold text-slate-900">Ask about the appropriate next step</h2>
                  <p className="premium-prose mt-4">Do not submit a child&apos;s medical records in this general form. A parent or legal guardian must consent, and the team can first explain a suitable contact path.</p>
                </div>
                <ContextualEnquiryForm
                  key={`pediatric-${completed.revision}`}
                  type="finder"
                  service="Pediatric hearing-care pathway guidance"
                  sourcePath={pagePath}
                  initialCity={completed.preferences.city ?? ""}
                  context={{
                    journey: "pediatric_finder_diversion",
                    preferences: { agePath: "child", ...enquiryPreferences },
                  }}
                  heading="Request pediatric-path guidance"
                  submitLabel="Ask about the pediatric pathway"
                />
              </div>
            </div>
          ) : completed?.age === "adult" ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="premium-eyebrow">Verified-attribute result</p>
                  <h2 id="finder-results-heading" tabIndex={-1} className="mt-3 font-display text-4xl font-semibold text-slate-900">Ranked only where the evidence allows</h2>
                </div>
                <span className="premium-chip">{rankings.length} models with a verified match</span>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <aside className="rounded-2xl border border-teal-200 bg-teal-50 p-5 text-sm leading-relaxed text-teal-950">
                  <strong>Ranking gate:</strong> {directlyVerifiedModelCount} {snapshot.mode === "published" ? "Owner-approved" : "staged"} model guides
                  currently have the dated source status required for scoring. An unsupported
                  catalogue attribute never earns a match point.
                </aside>
                <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
                  <strong>Clinical boundary:</strong> even a verified preference match would not be a
                  device recommendation or establish hearing, ear, medical, fitting, or service suitability.
                </aside>
              </div>

              {scoringExclusions.length > 0 ? (
                <section aria-labelledby="not-scored-heading" className="premium-section mt-7 p-6 sm:p-8">
                  <h3 id="not-scored-heading" className="text-2xl font-semibold text-slate-900">Preferences carried forward but excluded from scoring</h3>
                  <ul className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    {scoringExclusions.map((note) => <li key={note} className="rounded-xl border border-slate-200 bg-white px-4 py-3">{note}</li>)}
                  </ul>
                </section>
              ) : null}

              {rankings.length > 0 ? (
                <ol className="mt-8 grid gap-7">
                  {rankings.map((result, index) => (
                    <li key={result.model.key} className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
                      <CatalogModelCard
                        model={result.model}
                        brand={getSnapshotBrand(snapshot, result.model.brandSlug)!}
                        headingLevel="h3"
                      />
                      <aside className="premium-card p-6" aria-label={`Why this guide is ranked ${index + 1}`}>
                        <p className="premium-eyebrow">Rank {index + 1}</p>
                        <h3 className="mt-4 text-2xl font-semibold text-slate-900">{result.matchedCriteria} verified preference {result.matchedCriteria === 1 ? "match" : "matches"}</h3>
                        <p className="premium-prose mt-3 text-sm">
                          Matched {result.matchedCriteria} of {result.evaluatedCriteria} stated
                          preferences that this model&apos;s verified fields could directly evaluate.
                        </p>
                        <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-slate-700">
                          {result.explanations.map((explanation) => <li key={explanation}>{explanation}</li>)}
                        </ul>
                      </aside>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="premium-card mt-8 p-8 text-center">
                  <h3 className="text-2xl font-semibold text-slate-900">No evidence-safe ranking was produced</h3>
                  <p className="premium-prose mx-auto mt-3 max-w-3xl">
                    Only attributes directly supported by the cited confirmed source can score.
                    Your answers remain available in this page&apos;s memory for the enquiry without
                    turning unknown details, budget, or home-visit preference into a recommendation.
                  </p>
                  <Link href="/hearing-aids" className="premium-button-secondary mt-5">Browse unranked model guides</Link>
                </div>
              )}

              <div className="mt-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
                <div>
                  <p className="premium-eyebrow">Preference follow-up</p>
                  <h2 className="mt-4 font-display text-4xl font-semibold text-slate-900">Carry every answer into a human review</h2>
                  <p className="premium-prose mt-4">
                    Answers and city leave this tab only if the enquiry form is submitted. Analytics
                    receives only a generic finder-completion event with no answers or location.
                  </p>
                </div>
                <ContextualEnquiryForm
                  key={`adult-${completed.revision}`}
                  type="finder"
                  service="Adult hearing-aid preference guidance"
                  sourcePath={pagePath}
                  initialCity={completed.preferences.city ?? ""}
                  context={{
                    journey: "adult_preference_finder",
                    preferences: {
                      agePath: "adult",
                      ...enquiryPreferences,
                      verifiedRankedModelSlugs: rankings.slice(0, 20).map((result) => result.model.slug),
                    },
                  }}
                  heading="Discuss my stated preferences"
                  submitLabel="Send preference enquiry"
                />
              </div>
            </>
          ) : (
            <div className="premium-card p-8 text-center">
              <h2 id="finder-results-heading" tabIndex={-1} className="text-2xl font-semibold text-slate-900">Complete the preference questions to begin</h2>
              <p className="premium-prose mt-3">The page separates the adult preference organiser from pediatric clinical guidance before showing any result.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
