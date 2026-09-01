import { ProductStatus, type Prisma } from "@prisma/client";
import {
  catalogFeatureKeys,
  type CatalogFeatureRecord,
  type TriState,
} from "@/lib/catalog/types";

export type CatalogDraftPolicyCode =
  | "INVALID_JSON"
  | "OBJECT_REQUIRED"
  | "INVENTORY_CLAIM";

export class CatalogDraftPolicyError extends Error {
  constructor(public readonly code: CatalogDraftPolicyCode) {
    super(code);
    this.name = "CatalogDraftPolicyError";
  }
}

const triStates = new Set<TriState>(["yes", "no", "unknown"]);
const inventoryClaimPattern =
  /\b(?:stock|inventory|in[ -]?stock|out[ -]?of[ -]?stock|limited[ -]?stock|stock[ -]?available|currently[ -]?available|available[ -]?now|available[ -]?to[ -]?(?:buy|purchase|order)|ready[ -]?to[ -]?ship|same[ -]?day[ -]?dispatch|sold[ -]?out|pre[ -]?order|only\s+\d+\s+left)\b/i;

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isInventoryFieldName(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    normalized.includes("stock") ||
    normalized.includes("inventory") ||
    normalized.includes("availability") ||
    normalized === "available" ||
    normalized.startsWith("availablequantity") ||
    normalized.startsWith("availableunits")
  );
}

function hasInventoryField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasInventoryField);
  if (typeof value === "string") return inventoryClaimPattern.test(value);
  if (!isJsonObject(value)) return false;
  return Object.entries(value).some(
    ([key, nested]) => isInventoryFieldName(key) || hasInventoryField(nested),
  );
}

export function normalizeCatalogFeatureRecord(
  input: Readonly<Record<string, string | undefined>>,
): CatalogFeatureRecord {
  return Object.fromEntries(
    catalogFeatureKeys.map((key) => {
      const value = input[key] ?? "unknown";
      if (!triStates.has(value as TriState)) {
        throw new CatalogDraftPolicyError("OBJECT_REQUIRED");
      }
      return [key, value as TriState];
    }),
  ) as CatalogFeatureRecord;
}

export function parseCatalogSpecificationsJson(
  input: string,
): Prisma.InputJsonObject | null {
  const source = input.trim();
  if (!source) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new CatalogDraftPolicyError("INVALID_JSON");
  }
  if (!isJsonObject(parsed)) throw new CatalogDraftPolicyError("OBJECT_REQUIRED");
  assertNoCatalogStructuredInventoryClaims(parsed);
  return parsed as Prisma.InputJsonObject;
}

export function assertNoCatalogStructuredInventoryClaims(value: unknown): void {
  if (hasInventoryField(value)) throw new CatalogDraftPolicyError("INVENTORY_CLAIM");
}

export function assertNoCatalogInventoryClaims(values: readonly (string | null)[]): void {
  if (values.some((value) => value && inventoryClaimPattern.test(value))) {
    throw new CatalogDraftPolicyError("INVENTORY_CLAIM");
  }
}

export function statusAfterCatalogFactsEdit(current: ProductStatus): ProductStatus {
  return current === ProductStatus.ARCHIVED ? ProductStatus.ARCHIVED : ProductStatus.DRAFT;
}
