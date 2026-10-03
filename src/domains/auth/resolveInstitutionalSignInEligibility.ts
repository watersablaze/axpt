import { isAdmin } from "@/domains/auth/isAdmin";

export type InstitutionalSignInEligibility =
  | {
      eligible: true;
      audience: "ADMIN";
    }
  | {
      eligible: true;
      audience: "REPRESENTATIVE";
    }
  | {
      eligible: false;
      audience: null;
    };

type EligibilityInput = {
  roles?: string[];
  permissions?: string[];
  representativeProgramParticipants?: Array<{
    standing: string;
  }>;
};

const REPRESENTATIVE_SIGN_IN_STANDINGS = new Set([
  "PROVISIONAL",
  "ACTIVE",
  "RESTRICTED",
  "SUSPENDED",
]);

/**
 * Authentication answers WHO MAY ESTABLISH AN AXPT SESSION.
 *
 * Authorization remains separate:
 * - Admin access is still governed by admin roles/permissions.
 * - Representative access is grounded in a canonical Program Participant.
 *
 * A suspended representative may authenticate so that their standing,
 * restrictions and institutional record remain visible. Suspension does
 * not imply exercisable authority.
 */
export function resolveInstitutionalSignInEligibility(
  input: EligibilityInput,
): InstitutionalSignInEligibility {
  if (
    isAdmin({
      roles: input.roles,
      permissions: input.permissions,
    })
  ) {
    return {
      eligible: true,
      audience: "ADMIN",
    };
  }

  const representativeEligible =
    input.representativeProgramParticipants?.some(
      (participant) =>
        REPRESENTATIVE_SIGN_IN_STANDINGS.has(
          participant.standing,
        ),
    ) ?? false;

  if (representativeEligible) {
    return {
      eligible: true,
      audience: "REPRESENTATIVE",
    };
  }

  return {
    eligible: false,
    audience: null,
  };
}
