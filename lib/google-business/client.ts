import {
  type GoogleBusinessAccount,
  type GoogleBusinessLocation,
  type GoogleReviewList,
} from "@/lib/google-business/types";

const ACCOUNT_API = "https://mybusinessaccountmanagement.googleapis.com/v1";
const INFORMATION_API = "https://mybusinessbusinessinformation.googleapis.com/v1";
const REVIEWS_API = "https://mybusiness.googleapis.com/v4";
const LOCATION_READ_MASK = [
  "name",
  "title",
  "storeCode",
  "phoneNumbers",
  "storefrontAddress",
  "websiteUri",
  "regularHours",
  "specialHours",
  "metadata",
].join(",");

export class GoogleBusinessApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code = "GOOGLE_BUSINESS_API_ERROR") {
    super("Google Business Profile could not complete the requested read operation.");
    this.name = "GoogleBusinessApiError";
    this.status = status;
    this.code = code;
  }
}

async function googleJson<T>(url: URL, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    let code = "GOOGLE_BUSINESS_API_ERROR";
    try {
      const body = (await response.json()) as { error?: { status?: string } };
      if (body.error?.status) code = body.error.status.slice(0, 80);
    } catch {
      // The response body is intentionally not logged or reflected to the browser.
    }
    throw new GoogleBusinessApiError(response.status, code);
  }
  return (await response.json()) as T;
}

export async function listGoogleBusinessAccounts(accessToken: string) {
  const accounts: GoogleBusinessAccount[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(`${ACCOUNT_API}/accounts`);
    url.searchParams.set("pageSize", "20");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const page = await googleJson<{ accounts?: GoogleBusinessAccount[]; nextPageToken?: string }>(
      url,
      accessToken,
    );
    accounts.push(...(page.accounts ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken && accounts.length < 100);
  return accounts;
}

export async function listGoogleBusinessLocations(accessToken: string, accountName: string) {
  if (!/^accounts\/[A-Za-z0-9_-]+$/.test(accountName)) {
    throw new GoogleBusinessApiError(400, "INVALID_ACCOUNT_NAME");
  }
  const locations: GoogleBusinessLocation[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(`${INFORMATION_API}/${accountName}/locations`);
    url.searchParams.set("readMask", LOCATION_READ_MASK);
    url.searchParams.set("pageSize", "100");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const page = await googleJson<{
      locations?: GoogleBusinessLocation[];
      nextPageToken?: string;
    }>(url, accessToken);
    locations.push(...(page.locations ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken && locations.length < 500);
  return locations;
}

export async function getGoogleBusinessLocation(accessToken: string, locationName: string) {
  if (!/^locations\/[A-Za-z0-9_-]+$/.test(locationName)) {
    throw new GoogleBusinessApiError(400, "INVALID_LOCATION_NAME");
  }
  const url = new URL(`${INFORMATION_API}/${locationName}`);
  url.searchParams.set("readMask", LOCATION_READ_MASK);
  return googleJson<GoogleBusinessLocation>(url, accessToken);
}

export async function listGoogleBusinessReviews(
  accessToken: string,
  accountName: string,
  locationName: string,
) {
  if (
    !/^accounts\/[A-Za-z0-9_-]+$/.test(accountName) ||
    !/^locations\/[A-Za-z0-9_-]+$/.test(locationName)
  ) {
    throw new GoogleBusinessApiError(400, "INVALID_REVIEW_PARENT");
  }
  const accountId = accountName.split("/")[1];
  const locationId = locationName.split("/")[1];
  const url = new URL(
    `${REVIEWS_API}/accounts/${accountId}/locations/${locationId}/reviews`,
  );
  url.searchParams.set("pageSize", "50");
  url.searchParams.set("orderBy", "updateTime desc");
  return googleJson<GoogleReviewList>(url, accessToken);
}
