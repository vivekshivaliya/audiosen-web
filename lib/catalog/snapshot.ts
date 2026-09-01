import {
  getStagedCatalogBrands,
  getStagedCatalogModels,
} from "@/lib/catalog/repository";
import type {
  CatalogBrand,
  CatalogFilterState,
  CatalogModel,
  CatalogSnapshot,
} from "@/lib/catalog/types";

export function getStagedCatalogSnapshot(): CatalogSnapshot {
  return {
    mode: "preview",
    brands: getStagedCatalogBrands(),
    models: getStagedCatalogModels(),
  };
}

export function getSnapshotBrand(
  snapshot: CatalogSnapshot,
  slug: string,
): CatalogBrand | undefined {
  return snapshot.brands.find((brand) => brand.slug === slug);
}

export function getSnapshotModel(
  snapshot: CatalogSnapshot,
  brandSlug: string,
  modelSlug: string,
): CatalogModel | undefined {
  return snapshot.models.find(
    (model) => model.brandSlug === brandSlug && model.slug === modelSlug,
  );
}

export function getSnapshotModelByKey(
  snapshot: CatalogSnapshot,
  key: string,
): CatalogModel | undefined {
  return snapshot.models.find((model) => model.key === key);
}

export function getSnapshotModelsByBrand(
  snapshot: CatalogSnapshot,
  brandSlug: string,
): readonly CatalogModel[] {
  return snapshot.models.filter((model) => model.brandSlug === brandSlug);
}

export function getSnapshotModelFullName(
  snapshot: CatalogSnapshot,
  model: Pick<CatalogModel, "brandSlug" | "name">,
): string {
  const brand = getSnapshotBrand(snapshot, model.brandSlug);
  if (!brand) return model.name;
  return model.name.toLocaleLowerCase("en-IN").startsWith(brand.name.toLocaleLowerCase("en-IN"))
    ? model.name
    : `${brand.name} ${model.name}`;
}

export function parseSnapshotModelKeys(
  snapshot: CatalogSnapshot,
  value: string | string[] | undefined,
): string[] {
  const raw = (Array.isArray(value) ? value.join(",") : value ?? "").slice(0, 4000);
  return Array.from(
    new Set(raw.split(",").map((key) => key.trim()).filter(Boolean)),
  )
    .filter((key) => Boolean(getSnapshotModelByKey(snapshot, key)))
    .slice(0, 3);
}

export function filterSnapshotModels(
  snapshot: CatalogSnapshot,
  filters: CatalogFilterState,
): readonly CatalogModel[] {
  const normalizedQuery = filters.query?.trim().toLocaleLowerCase("en-IN") ?? "";
  return snapshot.models.filter((model) => {
    const brand = getSnapshotBrand(snapshot, model.brandSlug);
    if (filters.brand && model.brandSlug !== filters.brand) return false;
    if (filters.style && model.style !== filters.style) return false;
    if (filters.charging === "rechargeable" && model.features.rechargeable !== "yes") return false;
    if (filters.charging === "unknown" && model.features.rechargeable !== "unknown") return false;
    if (
      filters.connectivity === "bluetooth" &&
      model.features.bluetoothStreaming !== "yes"
    ) {
      return false;
    }
    if (
      filters.connectivity === "unknown" &&
      model.features.bluetoothStreaming !== "unknown"
    ) {
      return false;
    }
    return !normalizedQuery ||
      `${brand?.name ?? ""} ${model.name}`
        .toLocaleLowerCase("en-IN")
        .includes(normalizedQuery);
  });
}
