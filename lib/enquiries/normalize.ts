import type { EnquiryInput } from "@/lib/enquiries/schema";

function present(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Normalizes common Indian mobile formats without rejecting valid international enquiries. */
export function normalizePhoneNumber(value: string): string {
  const supplied = value.trim();
  let digits = supplied.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) {
    return `+${digits}`;
  }
  return supplied.startsWith("+") ? `+${digits}` : digits;
}

export type NormalizedEnquiry = {
  age?: number;
  ageGroup?: string;
  selectedBrand?: string;
  selectedDevice?: string;
  hearingConcern?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  homeVisit?: boolean;
  preferredChannel?: string;
  preferredCallbackTime?: string;
  source: string;
  sourcePath: string;
};

export function normalizeEnquiry(
  input: EnquiryInput,
  fallbackSourcePath: string,
): NormalizedEnquiry {
  const details = input.details;

  return {
    age: details?.age,
    ageGroup: present(input.ageGroup),
    selectedBrand: present(
      input.brand || details?.selectedBrand || details?.preferredBrand || details?.repairBrand,
    ),
    selectedDevice: present(
      input.device || details?.selectedDevice || details?.preferredDevice || details?.deviceModel,
    ),
    hearingConcern: present(details?.hearingConcern || details?.problem),
    appointmentDate: details?.appointmentDate,
    appointmentTime: present(details?.appointmentTime),
    homeVisit: details?.homeVisit,
    preferredChannel: present(input.preferredChannel),
    preferredCallbackTime: present(input.preferredCallbackTime),
    source: present(input.source) || `${input.type}_form`,
    sourcePath: input.context?.sourcePath || input.sourcePath || fallbackSourcePath,
  };
}
