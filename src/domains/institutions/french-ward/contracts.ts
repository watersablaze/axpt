export const FRENCH_WARD_INSTITUTIONAL_PROFILE_STATUS = {
  CURRENT:
    "CURRENT",
} as const;

export type FrenchWardInstitutionalProfileStatus =
  (typeof FRENCH_WARD_INSTITUTIONAL_PROFILE_STATUS)[keyof typeof FRENCH_WARD_INSTITUTIONAL_PROFILE_STATUS];

export type FrenchWardInstitutionalProfile =
  Readonly<{
    reference:
      string;

    version:
      number;

    status:
      FrenchWardInstitutionalProfileStatus;

    legalName:
      string;

    displayName:
      string;

    classification:
      string;

    publicDescription:
      string;

    orientation:
      string;

    institutionalDefinition:
      readonly string[];

    domains:
      readonly string[];

    practiceAreas:
      readonly string[];

    operatingPrinciples:
      readonly string[];

    operatingContinuum:
      readonly string[];
  }>;

export type FrenchWardInstitutionalProfileProjection =
  FrenchWardInstitutionalProfile;

export function assertFrenchWardInstitutionalProfile(
  profile:
    FrenchWardInstitutionalProfile,
): void {
  if (
    !profile.reference.trim() ||
    profile.version < 1 ||
    !profile.legalName.trim() ||
    !profile.displayName.trim() ||
    !profile.publicDescription.trim() ||
    !profile.orientation.trim()
  ) {
    throw new Error(
      "[FRENCH_WARD_INSTITUTIONAL_PROFILE_IDENTITY_REQUIRED]",
    );
  }

  if (
    profile.domains.length === 0 ||
    profile.practiceAreas.length === 0 ||
    profile.operatingPrinciples.length === 0 ||
    profile.operatingContinuum.length === 0
  ) {
    throw new Error(
      "[FRENCH_WARD_INSTITUTIONAL_PROFILE_STRUCTURE_REQUIRED]",
    );
  }
}
