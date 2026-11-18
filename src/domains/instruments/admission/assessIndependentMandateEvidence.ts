/**
 * ECN-REG-1C.2D.2 — INDEPENDENT EVIDENCE / VERIFIER QUALIFICATION CONTRACT.
 *
 * Pure comparison of UNAUTHENTICATED observations. Source IDs and a claimed
 * recomputed digest are not proof of custody, actual hashing, issuer signature,
 * verifier competence, independence or current authorization. A future trusted
 * server boundary must obtain and authenticate each underlying observation.
 * NO database I/O, no permission grant and no operative result are possible.
 */
import type { EcoNommoMandateEvidenceCandidate } from "./assessEcoNommoMandateEvidence";

export type MandateEvidenceAuthenticationSources = Readonly<{
  document: Readonly<{
    evidenceReference: string;
    custodyReference: string;
    custodySourceId: string;
    recordedSha256: string;
    observedSha256: string;
    digestObservationSourceId: string;
  }> | null;
  issuerAuthentication: Readonly<{
    issuerUserId: string;
    issuerInstitutionId: string;
    signedDocumentSha256: string;
    signatureEvidenceId: string;
    credentialSourceId: string;
  }> | null;
  verifier: Readonly<{
    userId: string;
    institutionId: string;
    identityEvidenceId: string;
    competenceEvidenceId: string;
    independenceEvidenceId: string;
    currentStanding: "ACTIVE" | "INACTIVE";
    reviewedEvidenceReference: string;
    reviewedSha256: string;
  }> | null;
  // Explicit linkage to the same underlying mandate. A reference is not
  // itself proof of currentness; mandate lifecycle is evaluated separately.
  attestation: Readonly<{
    mandateReference: string;
    verifierUserId: string;
    evidenceReference: string;
    evidenceSourceId: string;
    observedAt: string;
  }> | null;
}>;

export type MandateEvidenceAuthenticationAssessment = Readonly<{
  standing: "SOURCE_INCOMPLETE" | "SOURCE_CONFLICTED" | "INDEPENDENT_VERIFICATION_REQUIRED";
  reasons: readonly string[];
  evidenceAuthenticated: false;
  verifierQualified: false;
  operativeAuthorityEstablished: false;
  admissionAuthorized: false;
}>;

const filled = (x: unknown): x is string =>
  typeof x === "string" && x.length > 0 && x.length <= 256 &&
  x === x.trim() && !/[\u0000-\u001f\u007f]/.test(x);
const digest = (x: unknown): x is string =>
  typeof x === "string" && /^[a-fA-F0-9]{64}$/.test(x);
const timestamp = (x: unknown): number | null => {
  if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x)) return null;
  const t = new Date(x);
  return Number.isFinite(t.getTime()) && t.toISOString() === x ? t.getTime() : null;
};

/** Negative-only: even a perfectly coherent snapshot remains unverified. */
export function assessIndependentMandateEvidence(
  mandate: EcoNommoMandateEvidenceCandidate | null | undefined,
  observations: MandateEvidenceAuthenticationSources | null | undefined,
  at: Date,
): MandateEvidenceAuthenticationAssessment {
  const incomplete: string[] = [];
  const conflicts: string[] = [];
  const decision = (
    standing: MandateEvidenceAuthenticationAssessment["standing"],
    reasons: string[],
  ): MandateEvidenceAuthenticationAssessment => ({
    standing, reasons: [...new Set(reasons)],
    evidenceAuthenticated: false, verifierQualified: false,
    operativeAuthorityEstablished: false, admissionAuthorized: false,
  });

  if (!(at instanceof Date) || !Number.isFinite(at.getTime()))
    return decision("SOURCE_CONFLICTED", ["ASSESSMENT_TIME_INVALID"]);
  if (!mandate || !observations)
    return decision("SOURCE_INCOMPLETE", ["MANDATE_OR_EVIDENCE_SOURCES_MISSING"]);

  const { document, issuerAuthentication: issuer, verifier, attestation } = observations;
  if (!document) incomplete.push("DOCUMENT_CUSTODY_SOURCE_MISSING");
  else {
    if (![document.evidenceReference, document.custodyReference,
      document.custodySourceId, document.digestObservationSourceId].every(filled))
      incomplete.push("DOCUMENT_SOURCE_REFERENCES_INCOMPLETE");
    if (document.evidenceReference !== mandate.evidenceReference ||
      document.custodyReference !== mandate.evidenceCustodyReference)
      conflicts.push("DOCUMENT_CUSTODY_BINDING_CONFLICT");
    if (![document.recordedSha256, document.observedSha256, mandate.evidenceSha256].every(digest))
      incomplete.push("DOCUMENT_DIGEST_INVALID");
    else if (document.recordedSha256.toLowerCase() !== document.observedSha256.toLowerCase() ||
      document.recordedSha256.toLowerCase() !== mandate.evidenceSha256.toLowerCase())
      conflicts.push("DOCUMENT_DIGEST_CONFLICT");
  }

  if (!issuer) incomplete.push("ISSUER_AUTHENTICATION_SOURCE_MISSING");
  else {
    if (![issuer.issuerUserId, issuer.issuerInstitutionId,
      issuer.signatureEvidenceId, issuer.credentialSourceId].every(filled))
      incomplete.push("ISSUER_CREDENTIAL_SOURCE_INCOMPLETE");
    if (issuer.issuerUserId !== mandate.issuerRepresentativeUserId ||
      issuer.issuerInstitutionId !== mandate.issuerInstitutionId)
      conflicts.push("ISSUER_SIGNATURE_IDENTITY_CONFLICT");
    if (!digest(issuer.signedDocumentSha256))
      incomplete.push("ISSUER_SIGNED_DIGEST_INVALID");
    else if (digest(mandate.evidenceSha256) &&
      issuer.signedDocumentSha256.toLowerCase() !== mandate.evidenceSha256.toLowerCase())
      conflicts.push("ISSUER_SIGNED_DIGEST_CONFLICT");
  }

  if (!verifier) incomplete.push("INDEPENDENT_VERIFIER_SOURCE_MISSING");
  else {
    if (![verifier.userId, verifier.institutionId, verifier.identityEvidenceId,
      verifier.competenceEvidenceId, verifier.independenceEvidenceId,
      verifier.reviewedEvidenceReference].every(filled))
      incomplete.push("VERIFIER_EVIDENCE_REFERENCES_INCOMPLETE");
    if (verifier.currentStanding !== "ACTIVE")
      conflicts.push("VERIFIER_STANDING_INACTIVE");
    if (verifier.userId === mandate.issuerRepresentativeUserId ||
      verifier.userId === mandate.holderUserId ||
      verifier.institutionId === mandate.issuerInstitutionId ||
      verifier.institutionId === mandate.representedInstitutionId)
      conflicts.push("VERIFIER_NOT_INDEPENDENT");
    if (verifier.reviewedEvidenceReference !== mandate.evidenceReference)
      conflicts.push("VERIFIER_DOCUMENT_BINDING_CONFLICT");
    if (!digest(verifier.reviewedSha256))
      incomplete.push("VERIFIER_REVIEWED_DIGEST_INVALID");
    else if (digest(mandate.evidenceSha256) &&
      verifier.reviewedSha256.toLowerCase() !== mandate.evidenceSha256.toLowerCase())
      conflicts.push("VERIFIER_REVIEWED_DIGEST_CONFLICT");
  }

  if (!attestation) incomplete.push("INDEPENDENT_ATTESTATION_MISSING");
  else {
    if (![attestation.verifierUserId, attestation.evidenceReference,
      attestation.evidenceSourceId, attestation.mandateReference].every(filled))
      incomplete.push("ATTESTATION_SOURCE_INCOMPLETE");
    if (attestation.mandateReference !== mandate.mandateReference ||
      attestation.evidenceReference !== mandate.evidenceReference ||
      (verifier !== null && attestation.verifierUserId !== verifier.userId))
      conflicts.push("ATTESTATION_BINDING_CONFLICT");
    const observed = timestamp(attestation.observedAt);
    if (observed === null || observed > at.getTime())
      incomplete.push("ATTESTATION_TIME_NOT_VALID");
  }

  if (conflicts.length) return decision("SOURCE_CONFLICTED", conflicts);
  if (incomplete.length) return decision("SOURCE_INCOMPLETE", incomplete);
  return decision("INDEPENDENT_VERIFICATION_REQUIRED",
    ["SOURCE_REFERENCES_AND_DIGEST_OBSERVATIONS_ARE_NOT_AUTHENTICATED"]);
}
