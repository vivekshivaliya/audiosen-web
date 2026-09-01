"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

type PickerModel = {
  key: string;
  name: string;
  brandName: string;
};

type ComparePickerProps = {
  models: readonly PickerModel[];
  selectedKeys: readonly string[];
};

export function ComparePicker({ models, selectedKeys }: ComparePickerProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(selectedKeys.slice(0, 3));
  const [message, setMessage] = useState("");

  function toggle(key: string, checked: boolean) {
    setMessage("");
    setSelected((current) => {
      if (!checked) return current.filter((value) => value !== key);
      if (current.includes(key)) return current;
      if (current.length >= 3) {
        setMessage("You can compare up to three models. Remove one before adding another.");
        return current;
      }
      return [...current, key];
    });
  }

  function updateComparison() {
    if (selected.length === 0) {
      setMessage("Select at least one model to build a comparison.");
      return;
    }

    trackEvent("hearing_aid_compare", {
      comparison_count: selected.length,
      journey: "compare_picker",
      page_path: window.location.pathname,
    });
    router.push(`/compare-hearing-aids?models=${encodeURIComponent(selected.join(","))}`);
  }

  return (
    <div className="premium-section p-5 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Choose up to three models</h2>
          <p className="premium-prose mt-2 text-sm">
            Your selection is stored in the page URL, so you can bookmark or share it.
          </p>
        </div>
        <p className="premium-chip" aria-live="polite">
          {selected.length} of 3 selected
        </p>
      </div>

      <fieldset className="mt-5">
        <legend className="sr-only">Models to compare</legend>
        <div className="grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => {
            const checked = selected.includes(model.key);
            const blocked = !checked && selected.length >= 3;

            return (
              <label
                key={model.key}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                  checked
                    ? "border-teal-700 bg-teal-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700"
                } ${blocked ? "opacity-55" : "cursor-pointer"}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={blocked}
                  onChange={(event) => toggle(model.key, event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-teal-700"
                />
                <span>
                  <strong className="block">{model.name}</strong>
                  <span className="text-xs text-slate-500">{model.brandName}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={updateComparison} className="premium-button-primary">
          Update comparison
        </button>
        <button
          type="button"
          onClick={() => {
            setSelected([]);
            setMessage("");
            router.push("/compare-hearing-aids");
          }}
          className="premium-button-secondary"
        >
          Clear selection
        </button>
      </div>

      <p className="mt-3 min-h-5 text-sm text-rose-800" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
