export type VerificationStatus = "verified";

export interface ExpertProfile {
  slug: string;
  name: string;
  professionalTitle: string;
  qualifications: readonly string[];
  registration: {
    authority: string;
    number: string;
    verifiedAt: string;
  };
  languages: readonly string[];
  scopeOfPractice: readonly string[];
  profileImage: {
    src: string;
    alt: string;
    publicationConsentRecordedAt: string;
  };
  biography: readonly string[];
  profileVerifiedAt: string;
  status: VerificationStatus;
}

/**
 * Only people whose identity, qualifications, active registration, image consent,
 * and public biography have been checked belong in this registry. An empty registry
 * is intentional until those facts are supplied and verified.
 */
export const verifiedExpertProfiles: readonly ExpertProfile[] = [];

export function getVerifiedExpertProfile(slug: string) {
  return verifiedExpertProfiles.find(
    (profile) => profile.slug === slug && profile.status === "verified",
  );
}
