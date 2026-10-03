import {
  resolveInstitutionalSignInEligibility,
} from "./resolveInstitutionalSignInEligibility";

type RepresentativeSessionValidityInput = {
  sessionTier:
    string | null | undefined;

  roles?:
    string[];

  permissions?:
    string[];

  representativeProgramParticipants?:
    Array<{
      standing:
        string;
    }>;
};

/**
 * AUTH-2B.1
 *
 * Representative sessions must remain grounded in the current
 * Representative Program record.
 *
 * SESSION ESTABLISHED ≠ SESSION PERMANENTLY ELIGIBLE
 *
 * Only sessions explicitly issued as "representative" require
 * this Program-standing revalidation here. Existing admin and
 * other institutional session behavior remains unchanged.
 */
export function resolveRepresentativeSessionValidity(
  input:
    RepresentativeSessionValidityInput,
): boolean {
  if (
    input.sessionTier !==
    "representative"
  ) {
    return true;
  }

  const eligibility =
    resolveInstitutionalSignInEligibility({
      roles:
        input.roles,

      permissions:
        input.permissions,

      representativeProgramParticipants:
        input.representativeProgramParticipants,
    });

  return eligibility.eligible;
}
