export const FRENCH_WARD_INSTITUTIONAL_PROFILE_STATUS = {
  CURRENT:
    "CURRENT",
} as const;

export type FrenchWardInstitutionalProfileStatus =
  (typeof FRENCH_WARD_INSTITUTIONAL_PROFILE_STATUS)[keyof typeof FRENCH_WARD_INSTITUTIONAL_PROFILE_STATUS];

export type FrenchWardInstitutionalOfficer = Readonly<{
  name: string;
  title: string;
  responsibility: string;
}>;

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

    corporateCoordinates: Readonly<{
      registrationJurisdiction: string;
      registrationNumber: string;
      corporateStatus: string;
      principalAddress: string;
      telephone: string;
    }>;

    commercialActivities: readonly string[];

    publicDescription:
      string;

    orientation:
      string;

    custodianshipThesis:
      string;

    transactionPreparation:
      readonly string[];

    establishedSourceRelationships:
      readonly string[];

    institutionalDefinition:
      readonly string[];

    leadership:
      readonly FrenchWardInstitutionalOfficer[];

    counterpartyEngagement:
      readonly string[];

    counterpartyDueDiligence:
      string;

    documentaryReadiness:
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
    !profile.orientation.trim() ||
    !profile.custodianshipThesis.trim() ||
    !profile.corporateCoordinates.registrationJurisdiction.trim() ||
    !profile.corporateCoordinates.registrationNumber.trim() ||
    !profile.corporateCoordinates.corporateStatus.trim() ||
    !profile.corporateCoordinates.principalAddress.trim() ||
    !profile.corporateCoordinates.telephone.trim() ||
    profile.commercialActivities.length === 0 ||
    profile.commercialActivities.some(activity => !activity.trim()) ||
    !profile.counterpartyDueDiligence.trim() ||
    profile.transactionPreparation.length !== 5 ||
    profile.establishedSourceRelationships.length === 0 ||
    profile.establishedSourceRelationships.some(
      statement => !statement.trim(),
    )
  ) {
    throw new Error(
      "[FRENCH_WARD_INSTITUTIONAL_PROFILE_IDENTITY_REQUIRED]",
    );
  }

  if (
    profile.leadership.length !== 3 ||
    profile.leadership.some(officer =>
      !officer.name.trim() ||
      !officer.title.trim() ||
      !officer.responsibility.trim()
    ) ||
    profile.counterpartyEngagement.length === 0 ||
    profile.counterpartyEngagement.some(statement => !statement.trim()) ||
    profile.documentaryReadiness.length === 0 ||
    profile.documentaryReadiness.some(statement => !statement.trim()) ||
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
