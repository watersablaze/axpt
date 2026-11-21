import { REPRESENTATIVE_AUTHORITY_KEY } from "../../contracts";
import type { RepresentativeAuthorityApplicabilityContext } from
  "../../applicability/contracts";
import { resolveRepresentativeProgramAuthorityApplicabilityWithClient } from
  "../../applicability/resolveRepresentativeProgramAuthorityApplicabilityWithClient";
import { projectFrenchWardInstitutionalProfile } from
  "@/domains/institutions/french-ward/projectFrenchWardInstitutionalProfile";
import { loadRepresentativeCommercialUtilityPackResourceWithClient } from
  "./loadRepresentativeCommercialUtilityPackResourceWithClient";
import { resolveRepresentativeCommercialUtilityPackConsumptionWithClient } from
  "./resolveRepresentativeCommercialUtilityPackConsumptionWithClient";

type Client =
  Parameters<typeof loadRepresentativeCommercialUtilityPackResourceWithClient>[0]["client"] &
  Parameters<typeof resolveRepresentativeCommercialUtilityPackConsumptionWithClient>[0]["client"] &
  Parameters<typeof resolveRepresentativeProgramAuthorityApplicabilityWithClient>[0]["client"];

/**
 * Server-owned eligibility for direct, named-recipient Profile invitations.
 * Performs no writes or delivery. The grant command must call this inside
 * its transaction, after acquiring the relevant governance locks.
 * Never pass commercial context directly from an HTTP request body.
 */
export async function resolveRepresentativeProfileInvitationWithClient(input: {
  client: Client;
  userId: string;
  appointmentId: string;
  resourceReleaseId: string;
  context?: Omit<RepresentativeAuthorityApplicabilityContext, "documentClass">;
  at?: Date;
}) {
  const evaluatedAt = input.at ?? new Date();
  if (!Number.isFinite(evaluatedAt.getTime())) {
    throw new Error("[ARP_PROFILE_INVITATION_TIME_INVALID]");
  }

  const profile = projectFrenchWardInstitutionalProfile();
  const resource = await loadRepresentativeCommercialUtilityPackResourceWithClient({
    client: input.client,
    userId: input.userId,
    resourceReleaseId: input.resourceReleaseId,
  });

  if (!resource || resource.kind !== "INSTITUTIONAL_PROFILE" ||
      resource.content.reference !== profile.reference ||
      resource.content.version !== profile.version) {
    return { allowed: false as const, reason: "CURRENT_PROFILE_RELEASE_REQUIRED" };
  }

  const context: RepresentativeAuthorityApplicabilityContext = {
    ...input.context,
    documentClass: "FRENCH_WARD_INSTITUTIONAL_PROFILE",
  };

  const transmission =
    await resolveRepresentativeCommercialUtilityPackConsumptionWithClient({
      client: input.client,
      userId: input.userId,
      appointmentId: input.appointmentId,
      resourceReleaseId: input.resourceReleaseId,
      action: "TRANSMIT",
      context,
      at: evaluatedAt,
    });

  if (!transmission.allowed) {
    return { allowed: false as const, reason: transmission.reason };
  }

  const introduction =
    await resolveRepresentativeProgramAuthorityApplicabilityWithClient({
      client: input.client,
      request: {
        appointmentId: input.appointmentId,
        authorityKey: REPRESENTATIVE_AUTHORITY_KEY.INTRODUCTION,
        context,
        at: evaluatedAt,
      },
    });

  if (introduction.approvalRequired === true) {
    return { allowed: false as const, reason: "REQUIRED_APPROVAL_NOT_VERIFIED" };
  }
  if (!introduction.exercisable || !introduction.applicable) {
    return { allowed: false as const, reason: introduction.reason };
  }

  return {
    allowed: true as const,
    policy: "REPRESENTATIVE_PROFILE_INVITATION_V1" as const,
    scope: "PROFILE_VIEW" as const,
    resourceReference: profile.reference,
    resourceVersion: profile.version,
    evaluatedAt,
    transmission,
    introduction,
  };
}
