import type {
  FrenchWardCurrentGoverningStanding,
} from "./loadCurrentFrenchWardGoverningStandingWithClient";

import type {
  FrenchWardCurrentInstitutionalParticipant,
} from "../participants/loadCurrentFrenchWardInstitutionalParticipantWithClient";

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
      admitted: true;
      mode: "INSTITUTIONAL";
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
 * A non-admin principal must hold either:
 * - current ACTIVE French-Ward governing standing; or
 * - current ACTIVE French-Ward institutional participation.
 *
 * Governing standing retains precedence when both are present.
 */
export function resolveFrenchWardOrientationAdmission(
  input: {
    admin: boolean;
    governingStanding:
      FrenchWardCurrentGoverningStanding | null;

    institutionalParticipant:
      FrenchWardCurrentInstitutionalParticipant | null;
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

  if (
    input.institutionalParticipant?.active === true
  ) {
    return {
      admitted: true,
      mode: "INSTITUTIONAL",
    };
  }

  return {
    admitted: false,
    mode: "DENIED",
  };
}
