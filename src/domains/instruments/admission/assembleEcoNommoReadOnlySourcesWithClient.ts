/**
 * ECN-REG-1C.2G.2A — non-operative, read-only source assembly.
 *
 * This bridge reads existing French-Ward recognition records through the
 * canonical loaders. Their references, titles and capacity classes do NOT
 * establish a canonical institution ID, issuer competence, a verifier,
 * a documentary mandate, or custody authentication. Those observations
 * remain null. No permission, admission or authenticated mandate is produced.
 *
 * The caller MUST derive sessionUserId from the authenticated server session;
 * passing request-body identities here is prohibited. No route calls this yet.
 */
import type { PrismaClient } from "@prisma/client";
import {
  loadCurrentFrenchWardInstitutionalParticipantWithClient,
} from "@/domains/institutions/french-ward/participants/loadCurrentFrenchWardInstitutionalParticipantWithClient";
import {
  loadCurrentFrenchWardGoverningStandingWithClient,
} from "@/domains/institutions/french-ward/governance/loadCurrentFrenchWardGoverningStandingWithClient";
import {
  resolveEcoNommoMandateCandidate,
  type EcoNommoMandateResolution,
  type EcoNommoMandateResolutionObservations,
} from "./resolveEcoNommoMandateCandidate";
import type { EcoNommoMandateEvidenceCandidate } from "./assessEcoNommoMandateEvidence";
import type { EcoNommoDraftAdmission } from "./validateEcoNommoDraftAdmission";

export type EcoNommoSourceAssemblyClient = Pick<
  PrismaClient, "frenchWardInstitutionalParticipant" | "frenchWardGoverningOfficer"
>;

type ScopedAdmission = Pick<EcoNommoDraftAdmission,
  "actorUserId" | "collectionKey" | "libraryReference" |
  "sourceReference" | "sourceEdition" | "instrumentStatus" | "versionStatus">;

export type EcoNommoSourceAssembly = Readonly<{
  observations: EcoNommoMandateResolutionObservations;
  resolution: EcoNommoMandateResolution;
  recognizedStanding: Readonly<{
    holder: "NOT_FOUND" | "ACTIVE" | "INACTIVE";
    issuer: "NOT_FOUND" | "ACTIVE" | "INACTIVE";
  }>;
  sourceWarnings: readonly string[];
  operativeAuthorityEstablished: false;
}>;

function validUserId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 &&
    value.length <= 128 && value === value.trim() &&
    !/[\u0000-\u001f\u007f]/.test(value);
}

/**
 * Only the TWO canonically recognized French-Ward read models are consulted.
 * This does not query unqualified instrument/mandate/evidence tables.
 * A source read failure rejects the call; it must not be interpreted as
 * a valid missing record or as authority.
 */
export async function assembleEcoNommoReadOnlySourcesWithClient(params: Readonly<{
  client: EcoNommoSourceAssemblyClient;
  sessionUserId: string | null;
  admission: ScopedAdmission;
  candidate: EcoNommoMandateEvidenceCandidate | null | undefined;
  at: Date;
}>): Promise<EcoNommoSourceAssembly> {
  const { client, sessionUserId, admission, candidate, at } = params;
  const warnings: string[] = [];
  const observations: EcoNommoMandateResolutionObservations = {
    sessionUserId: validUserId(sessionUserId) ? sessionUserId : null,
    holder: null,
    issuer: null,
    verifier: null,
    mandateEvidence: null,
    mandateCurrent: null,
  };

  // Invalid or mismatched session actor: do not even inspect participant
  // records for a user supplied in a documentary candidate.
  if (!validUserId(sessionUserId) || sessionUserId !== admission.actorUserId) {
    return {
      observations,
      resolution: resolveEcoNommoMandateCandidate(admission, candidate, observations, at),
      recognizedStanding: { holder: "NOT_FOUND", issuer: "NOT_FOUND" },
      sourceWarnings: ["VERIFIED_SESSION_ACTOR_NOT_BOUND"],
      operativeAuthorityEstablished: false,
    };
  }

  const issuerUserId = candidate?.issuerRepresentativeUserId;
  const [holder, issuer] = await Promise.all([
    loadCurrentFrenchWardInstitutionalParticipantWithClient({
      client, userId: sessionUserId,
    }),
    validUserId(issuerUserId)
      ? loadCurrentFrenchWardGoverningStandingWithClient({
          client, userId: issuerUserId,
        })
      : Promise.resolve(null),
  ]);

  const holderStanding = holder ? (holder.active ? "ACTIVE" : "INACTIVE") : "NOT_FOUND";
  const issuerStanding = issuer ? (issuer.active ? "ACTIVE" : "INACTIVE") : "NOT_FOUND";

  if (!holder) warnings.push("HOLDER_RECOGNITION_NOT_FOUND");
  else {
    if (holder.userId !== sessionUserId) warnings.push("HOLDER_RECORD_IDENTITY_CONFLICT");
    if (!holder.active) warnings.push("HOLDER_RECOGNITION_INACTIVE");
  }
  if (!issuer) warnings.push("ISSUER_GOVERNING_RECOGNITION_NOT_FOUND");
  else {
    if (issuer.userId !== issuerUserId) warnings.push("ISSUER_RECORD_IDENTITY_CONFLICT");
    if (!issuer.active) warnings.push("ISSUER_GOVERNING_RECOGNITION_INACTIVE");
  }

  // Neither existing read model provides a verified issuer/holder institution
  // identity tied to this mandate. In particular, do not map titles,
  // recognitionBasis, capacityClass or provenanceReference into authority.
  warnings.push("INSTITUTIONAL_IDENTITY_BINDING_UNQUALIFIED");
  warnings.push("INDEPENDENT_ISSUER_MANDATE_AND_VERIFIER_UNRESOLVED");

  return {
    observations,
    resolution: resolveEcoNommoMandateCandidate(admission, candidate, observations, at),
    recognizedStanding: { holder: holderStanding, issuer: issuerStanding },
    sourceWarnings: warnings,
    operativeAuthorityEstablished: false,
  };
}
