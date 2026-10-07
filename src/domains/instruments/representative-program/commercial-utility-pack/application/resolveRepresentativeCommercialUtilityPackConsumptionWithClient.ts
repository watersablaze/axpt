import { REPRESENTATIVE_AUTHORITY_KEY } from "../../contracts";
import type { RepresentativeAuthorityApplicabilityContext } from
  "../../applicability/contracts";
import { resolveRepresentativeProgramAuthorityApplicabilityWithClient } from
  "../../applicability/resolveRepresentativeProgramAuthorityApplicabilityWithClient";
import { loadRepresentativeCommercialUtilityPackWithClient } from
  "./loadRepresentativeCommercialUtilityPackWithClient";

type Client =
  Parameters<typeof loadRepresentativeCommercialUtilityPackWithClient>[0]["client"] &
  Parameters<typeof resolveRepresentativeProgramAuthorityApplicabilityWithClient>[0]["client"];

type AppointmentOwner = {
  participant: { userId: string | null };
};

export type RepresentativeCUPConsumptionAction =
  "VIEW" | "DOWNLOAD" | "PRESENT" | "TRANSMIT";

/**
 * ARP -> CUP Authority Consumption Contract V1.
 *
 * The authenticated server principal supplies userId.
 * The action handler supplies trusted commercial context.
 * Evaluate immediately before the governed server operation.
 *
 * VIEW / DOWNLOAD establish resource access only.
 * PRESENT / TRANSMIT also consume canonical ARP applicability.
 * An opaque approval reference never establishes verified approval.
 *
 * This evaluator performs no mutation and grants no authority.
 */
export async function resolveRepresentativeCommercialUtilityPackConsumptionWithClient(
  params: {
    client: Client;
    userId: string;
    resourceReleaseId: string;
    action: RepresentativeCUPConsumptionAction;
    appointmentId?: string;
    context?: RepresentativeAuthorityApplicabilityContext;
    at?: Date;
  },
) {
  const userId = params.userId.trim();
  const resourceReleaseId = params.resourceReleaseId.trim();
  const evaluatedAt = params.at ?? new Date();

  if (
    !userId ||
    !resourceReleaseId ||
    resourceReleaseId.length > 191 ||
    !Number.isFinite(evaluatedAt.getTime()) ||
    !["VIEW", "DOWNLOAD", "PRESENT", "TRANSMIT"].includes(params.action)
  ) {
    throw new Error("[REPRESENTATIVE_CUP_CONSUMPTION_INPUT_INVALID]");
  }

  const decision = (allowed: boolean, reason: string) => ({
    contractVersion: 1 as const,
    action: params.action,
    resourceReleaseId,
    evaluatedAt,
    allowed,
    reason,
    establishesAuthority: false as const,
  });

  const pack = await loadRepresentativeCommercialUtilityPackWithClient({
    client: params.client,
    userId,
  });

  const matches = pack?.modules.flatMap(entry =>
    entry.resources.filter(resource => resource.id === resourceReleaseId)
  ) ?? [];

  if (!matches.length) {
    return decision(false, "RESOURCE_UNAVAILABLE");
  }
  if (matches.length !== 1) {
    throw new Error("[REPRESENTATIVE_CUP_CONSUMPTION_RESOURCE_CONTRADICTION]");
  }

  const resource = matches[0];

  if (params.action === "VIEW") {
    return decision(true, "RESOURCE_VIEW_PERMITTED");
  }

  if (params.action === "DOWNLOAD") {
    return decision(
      resource.canDownload === true,
      resource.canDownload === true
        ? "RESOURCE_DOWNLOAD_PERMITTED"
        : "RESOURCE_PERMISSION_WITHHELD",
    );
  }

  const resourcePermitted = params.action === "PRESENT"
    ? resource.canPresent === true
    : resource.canTransmit === true;

  if (!resourcePermitted) {
    return decision(false, "RESOURCE_PERMISSION_WITHHELD");
  }

  const appointmentId = params.appointmentId?.trim();
  if (!appointmentId || appointmentId.length > 191) {
    return decision(false, "APPOINTMENT_REQUIRED");
  }

  const appointment: AppointmentOwner | null =
    await params.client.representativeProgramAppointment.findUnique({
      where: { id: appointmentId },
      select: { participant: { select: { userId: true } } },
    });

  if (!appointment || appointment.participant.userId !== userId) {
    return decision(false, "APPOINTMENT_UNAVAILABLE");
  }

  if (!params.context) {
    return decision(false, "COMMERCIAL_CONTEXT_REQUIRED");
  }

  const applicability =
    await resolveRepresentativeProgramAuthorityApplicabilityWithClient({
      client: params.client,
      request: {
        appointmentId,
        authorityKey: params.action === "PRESENT"
          ? REPRESENTATIVE_AUTHORITY_KEY.PRESENTATION
          : REPRESENTATIVE_AUTHORITY_KEY.COMMUNICATION,
        context: params.context,
        at: evaluatedAt,
      },
    });

  // V1 has no canonical approval-evidence verifier.
  // A caller-supplied approvalReference cannot bypass this gate.
  if (applicability.approvalRequired === true) {
    return {
      ...decision(false, "REQUIRED_APPROVAL_NOT_VERIFIED"),
      applicability,
    };
  }

  if (!applicability.exercisable || !applicability.applicable) {
    return {
      ...decision(false, applicability.reason),
      applicability,
    };
  }

  return {
    ...decision(true, "RESOURCE_USE_PERMITTED_WITHIN_CONTEXT"),
    applicability,
  };
}
