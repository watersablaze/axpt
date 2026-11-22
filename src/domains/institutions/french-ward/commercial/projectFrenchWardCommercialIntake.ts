import {
  FRENCH_WARD_COMMERCIAL_INTAKE,
} from "./canonicalCommercialIntake";

import {
  assertFrenchWardCommercialIntake,
  type FrenchWardCommercialIntakeProjection,
} from "./commercialIntakeContracts";

/**
 * Representative-safe projection of the canonical French-Ward
 * commercial-intake pathway.
 *
 * Projection exposes pathway identity only. Access authorization remains
 * outside CUP and must be resolved by the Institutional Access framework.
 */
export function projectFrenchWardCommercialIntake():
  FrenchWardCommercialIntakeProjection {
  const projection = {
    ...FRENCH_WARD_COMMERCIAL_INTAKE,
  };

  assertFrenchWardCommercialIntake(
    projection,
  );

  return projection;
}
