/**
 * ECN-REG-1C.2G.1 — PURE, READ-ONLY CANDIDATE RESOLUTION CONTRACT.
 *
 * This function compares independently supplied identity/standing/evidence
 * observations to a documentary mandate candidate. It performs NO reads.
 * The caller must obtain records through trusted server-side loaders, never
 * from an HTTP request body. Even a fully consistent result is NOT authenticated
 * authority and cannot be promoted to TrustedAdmissionAuthorityFacts.
 *
 * NO positive operative-authority outcome is exposed by this module.
 */
import {
  assessEcoNommoMandateEvidence,
  type EcoNommoMandateEvidenceCandidate,
} from "./assessEcoNommoMandateEvidence";
import type { EcoNommoDraftAdmission } from "./validateEcoNommoDraftAdmission";

type ScopedAdmission = Pick<EcoNommoDraftAdmission,
  "actorUserId" | "collectionKey" | "libraryReference" |
  "sourceReference" | "sourceEdition" | "instrumentStatus" | "versionStatus">;

export type EcoNommoMandateResolutionObservations = Readonly<{
  sessionUserId: string | null;
  holder: Readonly<{
    userId: string;
    institutionId: string;
    capacity: string;
    standing: "ACTIVE" | "INACTIVE";
  }> | null;
  issuer: Readonly<{
    userId: string;
    institutionId: string;
    standing: "ACTIVE" | "INACTIVE";
  }> | null;
  verifier: Readonly<{
    userId: string;
    institutionId: string;
    standing: "ACTIVE" | "INACTIVE";
  }> | null;
  mandateEvidence: Readonly<{
    reference: string;
    custodyReference: string;
    sha256: string;
    issuerAuthenticationReference: string;
    issuerCompetenceReference: string;
    holderAcceptanceReference: string;
    independentVerifierUserId: string;
  }> | null;
  mandateCurrent: Readonly<{
    reference: string;
    revoked: boolean;
    superseded: boolean;
  }> | null;
}>;

export type EcoNommoMandateResolution =
  | Readonly<{
      standing: "SOURCE_INCOMPLETE" | "SOURCE_CONFLICTED";
      reasons: readonly string[];
      operativeAuthorityEstablished: false;
    }>
  | Readonly<{
      standing: "AUTHENTICATION_REQUIRED";
      reasons: readonly ["INDEPENDENT_MANDATE_AUTHENTICATION_NOT_ESTABLISHED"];
      operativeAuthorityEstablished: false;
    }>;

const present = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && value === value.trim();

/**
 * All observations are provisional comparison material, not proof of
 * signatures, issuer competence, independence or delegation. The function
 * cannot return a positive grant, irrespective of its inputs.
 */
export function resolveEcoNommoMandateCandidate(
  admission: ScopedAdmission,
  candidate: EcoNommoMandateEvidenceCandidate | null | undefined,
  observations: EcoNommoMandateResolutionObservations | null | undefined,
  at: Date,
): EcoNommoMandateResolution {
  const incomplete: string[] = [];
  const conflicted: string[] = [];
  const documentary = assessEcoNommoMandateEvidence(admission, candidate, at);
  if (!documentary.consistent) {
    return {
      standing: "SOURCE_CONFLICTED",
      reasons: documentary.reasons.map(reason => "DOCUMENTARY_" + reason),
      operativeAuthorityEstablished: false,
    };
  }
  if (!candidate || !observations) {
    return { standing: "SOURCE_INCOMPLETE",
      reasons: ["RESOLVED_OBSERVATIONS_MISSING"],
      operativeAuthorityEstablished: false };
  }

  const { holder, issuer, verifier, mandateEvidence, mandateCurrent } = observations;
  if (!present(observations.sessionUserId)) incomplete.push("VERIFIED_SESSION_USER_MISSING");
  else if (observations.sessionUserId !== admission.actorUserId)
    conflicted.push("SESSION_ACTOR_MISMATCH");

  if (!holder) incomplete.push("HOLDER_STANDING_MISSING");
  else {
    if (!present(holder.userId) || !present(holder.institutionId) || !present(holder.capacity))
      incomplete.push("HOLDER_IDENTITY_INCOMPLETE");
    if (holder.userId !== admission.actorUserId ||
        holder.userId !== candidate.holderUserId ||
        holder.institutionId !== candidate.representedInstitutionId ||
        holder.capacity !== candidate.holderCapacity)
      conflicted.push("HOLDER_INSTITUTION_OR_CAPACITY_MISMATCH");
    if (holder.standing !== "ACTIVE") conflicted.push("HOLDER_STANDING_NOT_ACTIVE");
  }

  if (!issuer) incomplete.push("ISSUER_STANDING_MISSING");
  else {
    if (!present(issuer.userId) || !present(issuer.institutionId))
      incomplete.push("ISSUER_IDENTITY_INCOMPLETE");
    if (issuer.userId !== candidate.issuerRepresentativeUserId ||
        issuer.institutionId !== candidate.issuerInstitutionId)
      conflicted.push("ISSUER_IDENTITY_MISMATCH");
    if (issuer.standing !== "ACTIVE") conflicted.push("ISSUER_STANDING_NOT_ACTIVE");
  }

  if (!verifier) incomplete.push("VERIFIER_IDENTITY_MISSING");
  else {
    if (!present(verifier.userId) || !present(verifier.institutionId))
      incomplete.push("VERIFIER_IDENTITY_INCOMPLETE");
    if (verifier.standing !== "ACTIVE") conflicted.push("VERIFIER_STANDING_NOT_ACTIVE");
    if (verifier.userId === candidate.holderUserId ||
        verifier.userId === candidate.issuerRepresentativeUserId ||
        verifier.institutionId === candidate.issuerInstitutionId ||
        verifier.institutionId === candidate.representedInstitutionId)
      conflicted.push("VERIFIER_NOT_INDEPENDENT");
  }

  if (!mandateEvidence) incomplete.push("MANDATE_EVIDENCE_NOT_RESOLVED");
  else {
    if (!present(mandateEvidence.reference) ||
        !present(mandateEvidence.custodyReference) ||
        !present(mandateEvidence.sha256) ||
        !present(mandateEvidence.issuerAuthenticationReference) ||
        !present(mandateEvidence.issuerCompetenceReference) ||
        !present(mandateEvidence.holderAcceptanceReference) ||
        !present(mandateEvidence.independentVerifierUserId))
      incomplete.push("MANDATE_EVIDENCE_RECORD_INCOMPLETE");
    if (mandateEvidence.reference !== candidate.evidenceReference ||
        mandateEvidence.custodyReference !== candidate.evidenceCustodyReference ||
        mandateEvidence.sha256.toLowerCase() !== candidate.evidenceSha256.toLowerCase() ||
        mandateEvidence.issuerAuthenticationReference !== candidate.evidenceIssuerAuthenticationReference ||
        mandateEvidence.issuerCompetenceReference !== candidate.evidenceIssuerCompetenceReference ||
        mandateEvidence.holderAcceptanceReference !== candidate.evidenceHolderAcceptanceReference ||
        mandateEvidence.independentVerifierUserId !== verifier?.userId)
      conflicted.push("MANDATE_EVIDENCE_BINDING_MISMATCH");
  }

  if (!mandateCurrent) incomplete.push("MANDATE_LIFECYCLE_NOT_RESOLVED");
  else {
    if (!present(mandateCurrent.reference)) incomplete.push("MANDATE_REFERENCE_MISSING");
    if (mandateCurrent.reference !== candidate.mandateReference ||
        mandateCurrent.revoked !== false ||
        mandateCurrent.superseded !== false)
      conflicted.push("MANDATE_LIFECYCLE_CONFLICT");
  }

  if (conflicted.length) {
    return { standing: "SOURCE_CONFLICTED", reasons: conflicted,
      operativeAuthorityEstablished: false };
  }
  if (incomplete.length) {
    return { standing: "SOURCE_INCOMPLETE", reasons: incomplete,
      operativeAuthorityEstablished: false };
  }

  // Intentional dead end: no issuer-authentication source or delegation proof
  // has yet been qualified to turn these observations into operative authority.
  return { standing: "AUTHENTICATION_REQUIRED",
    reasons: ["INDEPENDENT_MANDATE_AUTHENTICATION_NOT_ESTABLISHED"],
    operativeAuthorityEstablished: false };
}
