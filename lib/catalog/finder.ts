import {
  catalogStyleLabels,
  getStagedCatalogBrands,
  getStagedCatalogModels,
} from "@/lib/catalog/repository";
import type {
  CatalogBrand,
  CatalogBrandSlug,
  CatalogDeviceStyle,
  CatalogModel,
} from "@/lib/catalog/types";

export const finderCurrentUserValues = ["yes", "no", "not-sure"] as const;
export const finderChargingValues = ["rechargeable", "replaceable-battery", "no-preference"] as const;
export const finderStreamingValues = ["important", "not-needed", "no-preference"] as const;
export const finderLifestyleValues = [
  "conversation-groups",
  "phone-media",
  "outdoors-active",
  "quiet-one-to-one",
  "mixed-routine",
  "not-sure",
] as const;
export const finderVisibilityValues = ["discreet", "easy-to-handle", "no-preference"] as const;
export const finderBudgetValues = [
  "under-50000",
  "50000-100000",
  "100000-200000",
  "over-200000",
  "not-sure",
] as const;
export const finderHomeVisitValues = ["yes", "no", "not-sure"] as const;

export type FinderCurrentUser = (typeof finderCurrentUserValues)[number];
export type FinderCharging = (typeof finderChargingValues)[number];
export type FinderStreaming = (typeof finderStreamingValues)[number];
export type FinderLifestyle = (typeof finderLifestyleValues)[number];
export type FinderVisibility = (typeof finderVisibilityValues)[number];
export type FinderBudget = (typeof finderBudgetValues)[number];
export type FinderHomeVisit = (typeof finderHomeVisitValues)[number];

export type FinderPreferences = {
  brand?: CatalogBrandSlug;
  style?: CatalogDeviceStyle;
  currentUser?: FinderCurrentUser;
  charging?: FinderCharging;
  streaming?: FinderStreaming;
  lifestyle?: FinderLifestyle;
  visibility?: FinderVisibility;
  budget?: FinderBudget;
  homeVisit?: FinderHomeVisit;
  city?: string;
};

export type RankedFinderModel = {
  model: CatalogModel;
  matchedCriteria: number;
  evaluatedCriteria: number;
  explanations: string[];
};

function includesValue<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value);
}

export function parseFinderCurrentUser(value: string): FinderCurrentUser | undefined {
  return includesValue(finderCurrentUserValues, value) ? value : undefined;
}

export function parseFinderCharging(value: string): FinderCharging | undefined {
  return includesValue(finderChargingValues, value) ? value : undefined;
}

export function parseFinderStreaming(value: string): FinderStreaming | undefined {
  return includesValue(finderStreamingValues, value) ? value : undefined;
}

export function parseFinderLifestyle(value: string): FinderLifestyle | undefined {
  return includesValue(finderLifestyleValues, value) ? value : undefined;
}

export function parseFinderVisibility(value: string): FinderVisibility | undefined {
  return includesValue(finderVisibilityValues, value) ? value : undefined;
}

export function parseFinderBudget(value: string): FinderBudget | undefined {
  return includesValue(finderBudgetValues, value) ? value : undefined;
}

export function parseFinderHomeVisit(value: string): FinderHomeVisit | undefined {
  return includesValue(finderHomeVisitValues, value) ? value : undefined;
}

export function isDirectlyVerifiedCatalogModel(model: CatalogModel): boolean {
  return (
    (model.publication.status === "guidance-only" ||
      model.publication.status === "owner-approved") &&
    (model.verification.status === "manufacturer-source-checked" ||
      model.verification.status === "owner-source-confirmed") &&
    model.source.kind === "manufacturer" &&
    Boolean(model.source.url && model.source.checkedAt)
  );
}

export const isDirectlyVerifiedStagedModel = isDirectlyVerifiedCatalogModel;

function evaluateKnownFeature(
  state: "yes" | "no" | "unknown",
  expected: "yes" | "no",
): { evaluated: boolean; matched: boolean } {
  if (state === "unknown") return { evaluated: false, matched: false };
  return { evaluated: true, matched: state === expected };
}

export function rankCatalogModelsForFinder(
  preferences: FinderPreferences,
  models: readonly CatalogModel[] = getStagedCatalogModels(),
  brands: readonly CatalogBrand[] = getStagedCatalogBrands(),
): RankedFinderModel[] {
  const brandName = (brandSlug: CatalogBrandSlug) =>
    brands.find((brand) => brand.slug === brandSlug)?.name ?? brandSlug;
  const fullName = (model: CatalogModel) => {
    const name = brandName(model.brandSlug);
    return model.name.toLocaleLowerCase("en-IN").startsWith(name.toLocaleLowerCase("en-IN"))
      ? model.name
      : `${name} ${model.name}`;
  };

  return models
    .filter((model) => model.features.pediatricPath !== "yes")
    .filter(isDirectlyVerifiedCatalogModel)
    .map((model) => {
      const explanations: string[] = [];
      let matchedCriteria = 0;
      let evaluatedCriteria = 0;

      if (preferences.brand) {
        evaluatedCriteria += 1;
        if (model.brandSlug === preferences.brand) {
          matchedCriteria += 1;
          explanations.push(`Matches the stated ${brandName(model.brandSlug)} brand preference.`);
        }
      }

      if (preferences.style) {
        evaluatedCriteria += 1;
        if (model.style === preferences.style) {
          matchedCriteria += 1;
          explanations.push(`Matches the stated ${catalogStyleLabels[model.style]} style preference.`);
        }
      }

      if (preferences.charging === "rechargeable") {
        const result = evaluateKnownFeature(model.features.rechargeable, "yes");
        if (result.evaluated) evaluatedCriteria += 1;
        if (result.matched) {
          matchedCriteria += 1;
          explanations.push("Its directly verified record lists a rechargeable option.");
        }
      }

      if (preferences.streaming === "important") {
        const result = evaluateKnownFeature(model.features.bluetoothStreaming, "yes");
        if (result.evaluated) evaluatedCriteria += 1;
        if (result.matched) {
          matchedCriteria += 1;
          explanations.push("Its directly verified record lists Bluetooth or wireless streaming.");
        }
      }

      if (preferences.streaming === "not-needed") {
        const result = evaluateKnownFeature(model.features.bluetoothStreaming, "no");
        if (result.evaluated) evaluatedCriteria += 1;
        if (result.matched) {
          matchedCriteria += 1;
          explanations.push("Its directly verified record explicitly lists streaming as unavailable.");
        }
      }

      return { model, matchedCriteria, evaluatedCriteria, explanations };
    })
    .filter((result) => result.matchedCriteria > 0)
    .sort(
      (left, right) =>
        right.matchedCriteria - left.matchedCriteria ||
        right.matchedCriteria / right.evaluatedCriteria -
          left.matchedCriteria / left.evaluatedCriteria ||
        fullName(left.model).localeCompare(fullName(right.model)),
    );
}

export function finderScoringExclusions(preferences: FinderPreferences): string[] {
  const exclusions: string[] = [];

  if (preferences.currentUser) {
    exclusions.push("Current-device use is carried to the enquiry but is not a product score.");
  }
  if (preferences.charging === "replaceable-battery") {
    exclusions.push("Replaceable-battery preference is not scored because the catalogue has no approved battery-type field.");
  }
  if (preferences.lifestyle) {
    exclusions.push("Lifestyle preference is not scored because no approved model-to-lifestyle mapping is published.");
  }
  if (preferences.visibility && preferences.visibility !== "no-preference") {
    exclusions.push("Visibility preference is not inferred from physical style and is therefore not scored.");
  }
  if (preferences.budget) {
    exclusions.push("Budget is not scored because approved model-level prices or price bands are not published.");
  }
  if (preferences.homeVisit) {
    exclusions.push("Home-visit preference is not scored because no approved model/location availability matrix is published.");
  }
  if (preferences.city) {
    exclusions.push("City is used only to discuss the service path; it is not used to rank a model or sent to analytics.");
  }

  if (
    preferences.brand ||
    preferences.style ||
    preferences.charging === "rechargeable" ||
    (preferences.streaming && preferences.streaming !== "no-preference")
  ) {
    exclusions.push(
      "Brand, style, recharge, and streaming can affect ranking only for a catalog model with a dated confirmed source; unsupported attributes are excluded.",
    );
  }

  return exclusions;
}

export function finderPreferencesForEnquiry(
  preferences: FinderPreferences,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(preferences)
      .filter(([key, value]) => key !== "city" && Boolean(value))
      .map(([key, value]) => [key, String(value)]),
  );
}
