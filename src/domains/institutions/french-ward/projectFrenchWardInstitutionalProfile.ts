import {
  FRENCH_WARD_INSTITUTIONAL_PROFILE,
} from "./canonicalInstitutionalProfile";

import {
  assertFrenchWardInstitutionalProfile,
  type FrenchWardInstitutionalProfileProjection,
} from "./contracts";

/**
 * Representative-safe projection of the canonical French-Ward profile.
 *
 * V1 intentionally projects only stable institutional identity.
 *
 * It does not project:
 * - representative authority;
 * - source-specific authority;
 * - transaction-specific commercial terms;
 * - mandates;
 * - allocations;
 * - pricing;
 * - settlement instructions.
 */
export function projectFrenchWardInstitutionalProfile():
  FrenchWardInstitutionalProfileProjection {
  const projection = {
    ...FRENCH_WARD_INSTITUTIONAL_PROFILE,

    institutionalDefinition: [
      ...FRENCH_WARD_INSTITUTIONAL_PROFILE
        .institutionalDefinition,
    ],

    domains: [
      ...FRENCH_WARD_INSTITUTIONAL_PROFILE
        .domains,
    ],

    practiceAreas: [
      ...FRENCH_WARD_INSTITUTIONAL_PROFILE
        .practiceAreas,
    ],

    operatingPrinciples: [
      ...FRENCH_WARD_INSTITUTIONAL_PROFILE
        .operatingPrinciples,
    ],

    operatingContinuum: [
      ...FRENCH_WARD_INSTITUTIONAL_PROFILE
        .operatingContinuum,
    ],
  };

  assertFrenchWardInstitutionalProfile(
    projection,
  );

  return projection;
}
