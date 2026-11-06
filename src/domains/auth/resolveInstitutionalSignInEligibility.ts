import { isAdmin } from "@/domains/auth/isAdmin";

export type InstitutionalSignInEligibility =
  | {
      eligible: true;
      audience: "ADMIN";
    }
  | {
      eligible: true;
      audience: "FRENCH_WARD_GOVERNING";
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

  frenchWardGoverningStanding?: {
    status: string;
    endedAt?: Date | null;
  } | null;

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
 * Audience priority:
 *
 * ADMIN
 *   > FRENCH_WARD_GOVERNING
 *   > REPRESENTATIVE
 *
 * Authorization remains separate.
 *
 * French-Ward governing standing establishes institutional
 * recognition only. It does not grant AXPT permissions,
 * commercial authority, instrument authority or resource access.
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

  const governing =
    input.frenchWardGoverningStanding;

  if (
    governing?.status === "ACTIVE" &&
    governing.endedAt == null
  ) {
    return {
      eligible: true,
      audience: "FRENCH_WARD_GOVERNING",
    };
  }

  const representativeEligible =
    input.representativeProgramParticipants?.some(
      participant =>
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
