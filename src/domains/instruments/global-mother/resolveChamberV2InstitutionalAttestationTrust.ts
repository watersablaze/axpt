/**
 * GM-V2.1B.2B.3 — Pure assessment of an UNAUTHENTICATED institutional
 * attestation snapshot. No caller-supplied flag or reference proves that
 * an issuing institution or a mandate is genuine. This module is NOT an
 * eligibility evidence producer, source loader, credential checker, or
 * admission authority.
 */
export type ChamberV2AttestationTrustStanding =
  | "STRUCTURALLY_SUPPORTED"
  | "UNVERIFIED"
  | "REVOKED"
  | "CONFLICTED";

export type ChamberV2AttestationClaim = Readonly<{
  userId: string;
  institutionId: string;
  capacity: string;
}>;

/** All assertions below are untrusted until independently loaded and checked. */
export type ChamberV2AttestationSnapshot = Readonly<{
  subjectUserId: string;
  subjectIdentityEvidenceReference: string;
  representedInstitutionId: string;
  representedInstitutionEvidenceReference: string;
  capacity: string;
  issuerInstitutionId: string;
  issuerInstitutionEvidenceReference: string;
  issuerCompetenceEvidenceReference: string;
  issuerAuthorityReference: string;
  mandateReference: string;
  mandateEvidenceReference: string;
  mandateAuthenticityEvidenceReference: string;
  verificationActorUserId: string;
  verificationEvidenceReference: string;
  verifiedAt: Date;
  effectiveAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  suspendedAt: Date | null;
  supersededByMandateReference: string | null;
  scope: readonly string[];
}>;

export type ChamberV2AttestationTrustAssessment = Readonly<{
  standing: ChamberV2AttestationTrustStanding;
  reason: string;
  mandateReferences: readonly string[];
  evaluatedAt: Date;
  /** Never represents an authenticated or currently authoritative mandate. */
  operationallyUsable: false;
}>;

const filled = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0 && v.trim() === v;
const date = (v: unknown): v is Date =>
  v instanceof Date && Number.isFinite(v.getTime());
const optionalDate = (v: unknown): v is Date | null => v === null || date(v);
const optionalRef = (v: unknown): v is string | null => v === null || filled(v);
const chamberRef = (v: string) =>
  v.startsWith("GM-CHAMBER-") || v.startsWith("CHAMBER_ADMISSION:") ||
  v.startsWith("INSTITUTIONAL_ACCESS_GRANT:") || v.startsWith("RECIPIENT_GRANT:");

export function resolveChamberV2InstitutionalAttestationTrust(params: Readonly<{
  claim: ChamberV2AttestationClaim;
  attestations: readonly ChamberV2AttestationSnapshot[];
  at: Date;
}>): ChamberV2AttestationTrustAssessment {
  const result = (
    standing: ChamberV2AttestationTrustStanding,
    reason: string,
    mandateReferences: readonly string[] = [],
  ): ChamberV2AttestationTrustAssessment => ({
    standing, reason, mandateReferences,
    evaluatedAt: params.at,
    operationallyUsable: false,
  });

  if (!date(params.at) || !params.claim ||
      !filled(params.claim.userId) || !filled(params.claim.institutionId) ||
      !filled(params.claim.capacity) || !Array.isArray(params.attestations)) {
    return result("UNVERIFIED", "INVALID_INPUT");
  }

  const exact = params.attestations.filter((a) => a &&
    a.subjectUserId === params.claim.userId &&
    a.representedInstitutionId === params.claim.institutionId &&
    a.capacity === params.claim.capacity);

  // Even an invalid, revoked or superseded second assertion prevents
  // arbitrary selection of an apparently favorable mandate.
  if (exact.length > 1) {
    return result("CONFLICTED", "MULTIPLE_EXACT_MANDATES");
  }
  if (!exact.length) return result("UNVERIFIED", "NO_EXACT_MANDATE");

  const a = exact[0];
  const refs = [a.mandateReference].filter(filled);
  const required = [
    a.subjectIdentityEvidenceReference,
    a.representedInstitutionEvidenceReference,
    a.issuerInstitutionId,
    a.issuerInstitutionEvidenceReference,
    a.issuerCompetenceEvidenceReference,
    a.issuerAuthorityReference,
    a.mandateReference,
    a.mandateEvidenceReference,
    a.mandateAuthenticityEvidenceReference,
    a.verificationActorUserId,
    a.verificationEvidenceReference,
  ];
  if (!required.every(filled) ||
      !date(a.verifiedAt) || !date(a.effectiveAt) ||
      !optionalDate(a.expiresAt) || !optionalDate(a.revokedAt) ||
      !optionalDate(a.suspendedAt) ||
      !optionalRef(a.supersededByMandateReference) ||
      !Array.isArray(a.scope) || a.scope.length === 0 ||
      !a.scope.every(filled) || new Set(a.scope).size !== a.scope.length ||
      (a.expiresAt !== null && a.expiresAt.getTime() <= a.effectiveAt.getTime())) {
    return result("UNVERIFIED", "INCOMPLETE_OR_INVALID_ATTESTATION", refs);
  }

  if (required.some(chamberRef)) {
    return result("UNVERIFIED", "NON_INDEPENDENT_OR_SELF_REFERENTIAL_SOURCE", refs);
  }
  if (a.revokedAt !== null || a.suspendedAt !== null ||
      a.supersededByMandateReference !== null) {
    return result("REVOKED", "MANDATE_NOT_CURRENT", refs);
  }
  if (a.verifiedAt.getTime() > params.at.getTime() ||
      a.effectiveAt.getTime() > params.at.getTime()) {
    return result("UNVERIFIED", "VERIFICATION_OR_MANDATE_NOT_YET_EFFECTIVE", refs);
  }
  if (a.expiresAt !== null && a.expiresAt.getTime() <= params.at.getTime()) {
    return result("UNVERIFIED", "MANDATE_EXPIRED", refs);
  }
  if (!a.scope.includes(params.claim.capacity)) {
    return result("UNVERIFIED", "CAPACITY_OUT_OF_MANDATE_SCOPE", refs);
  }

  // Structural consistency is not independent verification. Only a future
  // authenticated canonical source reader can establish provenance and
  // translate separately verified facts into Chamber capacity evidence.
  return result("STRUCTURALLY_SUPPORTED", "UNAUTHENTICATED_SNAPSHOT_ONLY", refs);
}
