export const GOOGLE_BUSINESS_SCOPE = "https://www.googleapis.com/auth/business.manage";

export type GoogleBusinessAccount = {
  name: string;
  accountName?: string;
  type?: string;
  role?: string;
  verificationState?: string;
};

export type GooglePostalAddress = {
  regionCode?: string;
  languageCode?: string;
  postalCode?: string;
  administrativeArea?: string;
  locality?: string;
  sublocality?: string;
  addressLines?: string[];
};

export type GoogleTimePeriod = {
  openDay?: string;
  openTime?: { hours?: number; minutes?: number };
  closeDay?: string;
  closeTime?: { hours?: number; minutes?: number };
};

export type GoogleBusinessLocation = {
  name: string;
  title?: string;
  storeCode?: string;
  phoneNumbers?: {
    primaryPhone?: string;
    additionalPhones?: string[];
  };
  storefrontAddress?: GooglePostalAddress;
  websiteUri?: string;
  regularHours?: { periods?: GoogleTimePeriod[] };
  specialHours?: { specialHourPeriods?: unknown[] };
  metadata?: {
    placeId?: string;
    mapsUri?: string;
    newReviewUri?: string;
    hasVoiceOfMerchant?: boolean;
  };
};

export type GoogleReview = {
  name: string;
  reviewId?: string;
  reviewer?: {
    profilePhotoUrl?: string;
    displayName?: string;
    isAnonymous?: boolean;
  };
  starRating?: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE" | string;
  comment?: string;
  createTime?: string;
  updateTime?: string;
};

export type GoogleReviewList = {
  reviews?: GoogleReview[];
  averageRating?: number;
  totalReviewCount?: number;
  nextPageToken?: string;
};
