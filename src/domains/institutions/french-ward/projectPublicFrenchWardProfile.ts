import {
  projectFrenchWardInstitutionalProfile,
} from "./projectFrenchWardInstitutionalProfile";

/**
 * Explicit public disclosure projection.
 *
 * This is not a second institutional profile.
 * Additions require deliberate publication review.
 */
export function projectPublicFrenchWardProfile() {
  const canonical = projectFrenchWardInstitutionalProfile();

  return {
    reference: canonical.reference,
    version: canonical.version,
    legalName: canonical.legalName,
    displayName: canonical.displayName,
    classification: canonical.classification,
    publicDescription: canonical.publicDescription,
    orientation: canonical.orientation,
    custodianshipThesis: canonical.custodianshipThesis,
    transactionPreparation: [...canonical.transactionPreparation],
    domains: [...canonical.domains],
    practiceAreas: [...canonical.practiceAreas],
  };
}

export type PublicFrenchWardProfile =
  ReturnType<typeof projectPublicFrenchWardProfile>;
