import type {
  FrenchWardCurrentGoverningStanding,
} from "./loadCurrentFrenchWardGoverningStandingWithClient";

export type FrenchWardOrientationAdmission =
  | Readonly<{
      admitted: true;
      mode: "ADMIN";
    }>
  | Readonly<{
      admitted: true;
      mode: "GOVERNING";
    }>
  | Readonly<{
      admitted: false;
      mode: "DENIED";
    }>;

/**
 * Orientation admission answers only whether an authenticated
 * principal may enter the French-Ward internal orientation surface.
 *
 * It does not grant:
 * - French-Ward governing standing;
 * - AXPT roles or permissions;
 * - commercial authority;
 * - instrument authority;
 * - execution authority;
 * - institutional resource access.
 *
 * ADMIN may conduct/review institutional orientation without
 * being represented as a French-Ward governing officer.
 *
 * A non-admin principal must hold current ACTIVE French-Ward
 * governing standing.
 */
export function resolveFrenchWardOrientationAdmission(
  input: {
    admin: boolean;
    governingStanding:
      FrenchWardCurrentGoverningStanding | null;
  },
): FrenchWardOrientationAdmission {
  if (input.admin) {
    return {
      admitted: true,
      mode: "ADMIN",
    };
  }

  if (
    input.governingStanding?.active === true
  ) {
    return {
      admitted: true,
      mode: "GOVERNING",
    };
  }

  return {
    admitted: false,
    mode: "DENIED",
  };
}
