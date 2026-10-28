/**
 * GM-V2.1B.2B.1 — Pure assessment of proposed independent institutional
 * capacity evidence. This function DOES NOT authenticate the origin of its
 * input and MUST NOT be used directly to emit Chamber eligibility evidence.
 * A future canonical, read-only authority loader must establish provenance.
 */
export type ChamberV2CapacityStanding =
  | "VERIFIED"
  | "UNVERIFIED"
  | "REVOKED"
  | "CONFLICTED";

export type ChamberV2CapacityClaim = Readonly<{
  userId: string;
  institutionId: string;
  capacity: string;
}>;

export type ChamberV2CapacityEvidence = Readonly<{
  subjectUserId: string;
  institutionId: string;
  capacity: string;
  sourceKind: string;
  sourceInstrumentReference: string;
  evidenceReference: string;
  issuerInstitutionId: string;
  issuerAuthorityReference: string;
  verifierUserId: string;
  verifiedAt: Date;
  effectiveAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
}>;

export type ChamberV2CapacityAssessment = Readonly<{
  standing: ChamberV2CapacityStanding;
  reason: string;
  matchingEvidenceReferences: readonly string[];
  evaluatedAt: Date;
  /** Always false in this pure, unauthenticated assessment layer. */
  operationallyUsable: false;
}>;

const INDEPENDENT_SOURCE = "INDEPENDENT_INSTITUTIONAL_MANDATE";
const NON_INDEPENDENT_KINDS = new Set([
  "CHAMBER_ADMISSION",
  "CHAMBER_ROOM_BINDING",
  "INSTITUTIONAL_ACCESS_GRANT",
  "RECIPIENT_GRANT",
  "REPRESENTATIVE_PROFILE",
  "SOURCE_AUTHORITY_PROFILE",
]);

const filled = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.trim() === value;

const validDate = (date: unknown): date is Date =>
  date instanceof Date && Number.isFinite(date.getTime());

function structurallySound(e: ChamberV2CapacityEvidence): boolean {
  return (
    filled(e.subjectUserId) &&
    filled(e.institutionId) &&
    filled(e.capacity) &&
    e.sourceKind === INDEPENDENT_SOURCE &&
    !NON_INDEPENDENT_KINDS.has(e.sourceKind) &&
    filled(e.sourceInstrumentReference) &&
    filled(e.evidenceReference) &&
    filled(e.issuerInstitutionId) &&
    filled(e.issuerAuthorityReference) &&
    filled(e.verifierUserId) &&
    validDate(e.verifiedAt) &&
    validDate(e.effectiveAt) &&
    (e.expiresAt === null || validDate(e.expiresAt)) &&
    (e.revokedAt === null || validDate(e.revokedAt)) &&
    (e.expiresAt === null || e.expiresAt.getTime() > e.effectiveAt.getTime())
  );
}

/**
 * The positive result means ONLY that a supplied snapshot passes logical
 * checks. Input provenance, issuer legitimacy, independent authentication,
 * and current source-of-truth verification are NOT established here.
 */
export function resolveChamberV2InstitutionalCapacity(params: Readonly<{
  claim: ChamberV2CapacityClaim;
  evidence: readonly ChamberV2CapacityEvidence[];
  at: Date;
}>): ChamberV2CapacityAssessment {
  const { claim, at } = params;
  const result = (
    standing: ChamberV2CapacityStanding,
    reason: string,
    matchingEvidenceReferences: readonly string[] = [],
  ): ChamberV2CapacityAssessment => ({
    standing,
    reason,
    matchingEvidenceReferences,
    evaluatedAt: at,
    operationallyUsable: false,
  });

  if (!validDate(at) || !filled(claim.userId) ||
      !filled(claim.institutionId) || !filled(claim.capacity) ||
      !Array.isArray(params.evidence)) {
    return result("UNVERIFIED", "INVALID_ASSESSMENT_INPUT");
  }

  const records = params.evidence;
  const exact = records.filter((e) =>
    e?.subjectUserId === claim.userId &&
    e?.institutionId === claim.institutionId &&
    e?.capacity === claim.capacity,
  );

  // Multiple purported records, including invalid records, are not
  // arbitrarily resolved by latest timestamp or array order.
  if (exact.length > 1) {
    return result("CONFLICTED", "MULTIPLE_CAPACITY_ASSERTIONS");
  }
  if (exact.length === 0) {
    return result("UNVERIFIED", "EXACT_INSTITUTIONAL_CAPACITY_NOT_FOUND");
  }

  const record = exact[0];
  if (!structurallySound(record)) {
    return result("UNVERIFIED", "UNSUPPORTED_OR_INCOMPLETE_PROVENANCE");
  }

  // Do not permit an admission row to authenticate itself, even if a caller
  // relabels it as an independent mandate.
  if (record.sourceInstrumentReference.startsWith("GM-CHAMBER-") ||
      record.evidenceReference.startsWith("GM-CHAMBER-")) {
    return result("UNVERIFIED", "SELF_REFERENTIAL_CHAMBER_PROVENANCE");
  }

  const ref = [record.evidenceReference];
  if (record.revokedAt !== null) {
    // This layer treats any recorded revocation as disabling the claim,
    // including an inconsistent future-dated revocation.
    return result("REVOKED", "SOURCE_AUTHORITY_REVOKED", ref);
  }
  if (record.verifiedAt.getTime() > at.getTime()) {
    return result("UNVERIFIED", "VERIFICATION_IN_FUTURE", ref);
  }
  if (record.effectiveAt.getTime() > at.getTime()) {
    return result("UNVERIFIED", "NOT_YET_EFFECTIVE", ref);
  }
  if (record.expiresAt !== null && record.expiresAt.getTime() <= at.getTime()) {
    return result("UNVERIFIED", "SOURCE_AUTHORITY_EXPIRED", ref);
  }
  return result("VERIFIED", "SUPPLIED_SNAPSHOT_LOGICALLY_VALID", ref);
}
