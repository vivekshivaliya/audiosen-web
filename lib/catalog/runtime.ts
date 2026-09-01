import "server-only";

import { cache } from "react";
import { getApprovedCatalogSnapshot } from "@/lib/catalog/approved-snapshot";
import {
  isCatalogPublicationEnabled,
  isCatalogStagingPreviewEnabled,
} from "@/lib/catalog/launch";
import { getStagedCatalogSnapshot } from "@/lib/catalog/snapshot";
import type { CatalogSnapshot } from "@/lib/catalog/types";

export const getActiveCatalogSnapshot = cache(async (): Promise<CatalogSnapshot | null> => {
  if (isCatalogPublicationEnabled()) {
    return getApprovedCatalogSnapshot();
  }
  if (isCatalogStagingPreviewEnabled()) {
    return getStagedCatalogSnapshot();
  }
  return null;
});
