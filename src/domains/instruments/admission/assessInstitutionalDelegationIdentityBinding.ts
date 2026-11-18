/**
 * ECN-REG-1C.2D.1 — SOURCE-INDEPENDENT, NEGATIVE-ONLY identity binding.
 *
 * A reference or active institutional standing cannot certify the issuing
 * institution's legal capacity, delegation, or the holder's permission.
 * This pure contract compares proposed identities with independently
 * resolved canonical user/institution identifiers. It does not load,
 * authenticate or grant anything. No positive operative outcome exists.
 */
import type { EcoNommoMandateEvidenceCandidate } from "./assessEcoNommoMandateEvidence";
import type { EcoNommoDraftAdmission } from "./validateEcoNommoDraftAdmission";

type ScopedAdmission = Pick<EcoNommoDraftAdmission, "actorUserId">;

export type InstitutionalIdentityObservation = Readonly<{
  userId: string;
  institutionId: string;
  identitySourceId: string;
  institutionBindingSourceId: string;
  standing: "ACTIVE" | "INACTIVE";
}>;

export type InstitutionalDelegationIdentitySources = Readonly<{
  sessionUserId: string | null;
  issuer: InstitutionalIdentityObservation | null;
  holder: (InstitutionalIdentityObservation & Readonly<{
    capacity: string;
    capacitySourceId: string;
  }>) | null;
  representedInstitution: Readonly<{
    institutionId: string;
    institutionalIdentitySourceId: string;
  }> | null;
  issuerCompetenceSourceId: string | null;
  delegationSourceId: string | null;
}>;

export type InstitutionalDelegationIdentityDecision = Readonly<{
  standing: "SOURCE_INCOMPLETE" | "SOURCE_CONFLICTED" | "AUTHENTICATION_REQUIRED";
  reasons: readonly string[];
  operativeAuthorityEstablished: false;
  admissionAuthorized: false;
}>;

const filled = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= 256 &&
  value.trim() === value && !/[\u0000-\u001f\u007f]/.test(value);

/**
 * Inputs are observations, NOT proof. Caller must independently authenticate
 * their origin. Institution identifiers must come from a canonical institution
 * identity source; title/role/provenance text is never a substitute.
 */
export function assessInstitutionalDelegationIdentityBinding(
  admission: ScopedAdmission,
  mandate: EcoNommoMandateEvidenceCandidate | null | undefined,
  sources: InstitutionalDelegationIdentitySources | null | undefined,
): InstitutionalDelegationIdentityDecision {
  const missing: string[] = [];
  const conflict: string[] = [];
  const result = (
    standing: InstitutionalDelegationIdentityDecision["standing"],
    reasons: string[],
  ): InstitutionalDelegationIdentityDecision => ({
    standing, reasons: [...new Set(reasons)],
    operativeAuthorityEstablished: false, admissionAuthorized: false,
  });
  if (!mandate || !sources) return result("SOURCE_INCOMPLETE", ["MANDATE_OR_BINDING_SOURCES_MISSING"]);
  if (!filled(admission?.actorUserId) || !filled(sources.sessionUserId))
    missing.push("AUTHENTICATED_ACTOR_REQUIRED");
  else if (admission.actorUserId !== sources.sessionUserId ||
      admission.actorUserId !== mandate.holderUserId)
    conflict.push("AUTHENTICATED_ACTOR_MISMATCH");

  const { issuer, holder, representedInstitution: represented } = sources;
  if (!issuer) missing.push("ISSUER_IDENTITY_BINDING_MISSING");
  else {
    if (![issuer.userId, issuer.institutionId, issuer.identitySourceId,
      issuer.institutionBindingSourceId].every(filled))
      missing.push("ISSUER_BINDING_SOURCE_INCOMPLETE");
    if (issuer.userId !== mandate.issuerRepresentativeUserId ||
      issuer.institutionId !== mandate.issuerInstitutionId)
      conflict.push("ISSUER_BINDING_CONFLICT");
    if (issuer.standing !== "ACTIVE") conflict.push("ISSUER_STANDING_INACTIVE");
  }

  if (!holder) missing.push("HOLDER_IDENTITY_BINDING_MISSING");
  else {
    if (![holder.userId, holder.institutionId, holder.identitySourceId,
      holder.institutionBindingSourceId, holder.capacity, holder.capacitySourceId].every(filled))
      missing.push("HOLDER_BINDING_SOURCE_INCOMPLETE");
    if (holder.userId !== mandate.holderUserId ||
      holder.userId !== admission.actorUserId ||
      holder.institutionId !== mandate.representedInstitutionId ||
      holder.capacity !== mandate.holderCapacity)
      conflict.push("HOLDER_BINDING_CONFLICT");
    if (holder.standing !== "ACTIVE") conflict.push("HOLDER_STANDING_INACTIVE");
  }

  if (!represented) missing.push("REPRESENTED_INSTITUTION_MISSING");
  else {
    if (![represented.institutionId, represented.institutionalIdentitySourceId].every(filled))
      missing.push("REPRESENTED_INSTITUTION_SOURCE_INCOMPLETE");
    if (represented.institutionId !== mandate.representedInstitutionId ||
      (holder !== null && represented.institutionId !== holder.institutionId))
      conflict.push("REPRESENTED_INSTITUTION_CONFLICT");
  }

  if (issuer && holder && issuer.userId === holder.userId)
    conflict.push("ISSUER_HOLDER_MUST_BE_DISTINCT");

  if (!filled(sources.issuerCompetenceSourceId))
    missing.push("ISSUER_COMPETENCE_EVIDENCE_MISSING");
  if (!filled(sources.delegationSourceId))
    missing.push("DELEGATION_EVIDENCE_MISSING");

  if (conflict.length) return result("SOURCE_CONFLICTED", conflict);
  if (missing.length) return result("SOURCE_INCOMPLETE", missing);
  return result("AUTHENTICATION_REQUIRED", ["CANONICAL_BINDINGS_NOT_INDEPENDENTLY_AUTHENTICATED"]);
}
