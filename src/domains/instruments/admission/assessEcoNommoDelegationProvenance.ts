/**
 * ECN-REG-1C.2G.2C — NON-OPERATIVE institutional delegation & provenance.
 * The seven evidence groups are CLAIMS, not trusted DB facts or verified
 * institutional authority. This module does not authenticate sources, read
 * databases, certify legal competence or authorize instrument registration.
 *
 * 1. issuer competence; 2. institution/issuer/holder binding;
 * 3. exact draft-admission scope; 4. custody and independently verified digest;
 * 5. verifier identity, competence and independence;
 * 6. withdrawal/revocation/supersession/current lifecycle;
 * 7. attributable, source-linked and durable verification trail.
 */
import { assessEcoNommoMandateEvidence, type EcoNommoMandateEvidenceCandidate } from "./assessEcoNommoMandateEvidence";
import type { EcoNommoDraftAdmission } from "./validateEcoNommoDraftAdmission";

type DraftScope = Pick<EcoNommoDraftAdmission,
  "actorUserId" | "collectionKey" | "libraryReference" | "sourceReference" |
  "sourceEdition" | "instrumentStatus" | "versionStatus">;

export type DelegationProvenanceClaim = Readonly<{
  // Each sourceId is a proposed locator; its provenance is NOT authenticated.
  issuerCompetence: Readonly<{
    institutionId: string;
    authoritySourceId: string;
    delegationPower: "DOCUMENTARY_DRAFT_ADMISSION";
    effectiveAt: string;
    expiresAt: string | null;
  }> | null;
  parties: Readonly<{
    issuerInstitutionId: string;
    issuerRepresentativeUserId: string;
    representedInstitutionId: string;
    holderUserId: string;
    holderCapacity: string;
    issuerIdentitySourceId: string;
    holderIdentitySourceId: string;
    representationSourceId: string;
  }> | null;
  scope: Readonly<{
    action: string;
    collectionKey: string;
    libraryReference: string;
    sourceReference: string;
    sourceEdition: string;
  }> | null;
  custody: Readonly<{
    documentReference: string;
    custodySourceId: string;
    recordedSha256: string;
    recomputedSha256: string;
    digestVerificationSourceId: string;
    digestVerifierUserId: string;
  }> | null;
  verifier: Readonly<{
    userId: string;
    institutionId: string;
    competenceSourceId: string;
    identitySourceId: string;
    independenceSourceId: string;
  }> | null;
  lifecycle: Readonly<{
    mandateReference: string;
    currentStateSourceId: string;
    effectiveAt: string;
    expiresAt: string | null;
    withdrawnAt: string | null;
    revokedAt: string | null;
    supersededAt: string | null;
    suspendedAt: string | null;
  }> | null;
  trail: readonly Readonly<{
    finding: "ISSUER_COMPETENCE" | "ISSUER_IDENTITY" | "HOLDER_BINDING" |
      "SCOPE" | "CUSTODY_DIGEST" | "VERIFIER_COMPETENCE" | "LIFECYCLE";
    recordId: string;
    sourceId: string;
    recorderUserId: string;
    observedAt: string;
  }>[] | null;
}>;

export type DelegationProvenanceAssessment = Readonly<{
  standing: "SOURCE_INCOMPLETE" | "SOURCE_CONFLICTED" | "INDEPENDENT_AUTHENTICATION_REQUIRED";
  reasons: readonly string[];
  operativeAuthorityEstablished: false;
  admissionAuthorized: false;
}>;

const validId = (x: unknown): x is string =>
  typeof x === "string" && x.length > 0 && x.length <= 256 &&
  x.trim() === x && !/[\u0000-\u001f\u007f]/.test(x);
const instant = (x: unknown): number | null => {
  if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x)) return null;
  const d = new Date(x);
  return Number.isFinite(d.getTime()) && d.toISOString() === x ? d.getTime() : null;
};
const validDigest = (x: unknown): x is string =>
  typeof x === "string" && /^[a-f\d]{64}$/i.test(x);
const REQUIRED = [
  "ISSUER_COMPETENCE", "ISSUER_IDENTITY", "HOLDER_BINDING", "SCOPE",
  "CUSTODY_DIGEST", "VERIFIER_COMPETENCE", "LIFECYCLE",
] as const;

/** This is a negative-only consistency gate. Source IDs and hashes alone prove nothing. */
export function assessEcoNommoDelegationProvenance(
  admission: DraftScope,
  mandate: EcoNommoMandateEvidenceCandidate | null | undefined,
  claim: DelegationProvenanceClaim | null | undefined,
  at: Date,
): DelegationProvenanceAssessment {
  const incomplete: string[] = [];
  const conflicts: string[] = [];
  const documentary = assessEcoNommoMandateEvidence(admission, mandate, at);
  if (!documentary.consistent) conflicts.push(...documentary.reasons.map(x => "MANDATE_" + x));
  if (!claim || typeof claim !== "object" || Array.isArray(claim)) {
    return { standing: conflicts.length ? "SOURCE_CONFLICTED" : "SOURCE_INCOMPLETE",
      reasons: conflicts.length ? conflicts : ["PROVENANCE_CLAIM_REQUIRED"],
      operativeAuthorityEstablished: false, admissionAuthorized: false };
  }
  if (!mandate || !(at instanceof Date) || !Number.isFinite(at.getTime())) {
    return { standing: "SOURCE_CONFLICTED", reasons: conflicts.length ? conflicts : ["INVALID_MANDATE_OR_TIME"],
      operativeAuthorityEstablished: false, admissionAuthorized: false };
  }
  const { issuerCompetence: power, parties, scope, custody, verifier, lifecycle, trail } = claim;

  if (!power) incomplete.push("ISSUER_COMPETENCE_MISSING");
  else {
    if (![power.institutionId, power.authoritySourceId].every(validId))
      incomplete.push("ISSUER_COMPETENCE_SOURCE_INCOMPLETE");
    if (power.institutionId !== mandate.issuerInstitutionId ||
        power.delegationPower !== "DOCUMENTARY_DRAFT_ADMISSION")
      conflicts.push("ISSUER_COMPETENCE_SCOPE_CONFLICT");
    const from = instant(power.effectiveAt), end = power.expiresAt === null ? null : instant(power.expiresAt);
    if (from === null || from > at.getTime() ||
        (power.expiresAt !== null && (end === null || end <= at.getTime() || end <= from)))
      conflicts.push("ISSUER_COMPETENCE_WINDOW_CONFLICT");
  }

  if (!parties) incomplete.push("PARTY_BINDINGS_MISSING");
  else {
    if (![parties.issuerInstitutionId, parties.issuerRepresentativeUserId, parties.representedInstitutionId,
      parties.holderUserId, parties.holderCapacity, parties.issuerIdentitySourceId,
      parties.holderIdentitySourceId, parties.representationSourceId].every(validId))
      incomplete.push("PARTY_BINDING_SOURCE_INCOMPLETE");
    if (parties.issuerInstitutionId !== mandate.issuerInstitutionId ||
        parties.issuerRepresentativeUserId !== mandate.issuerRepresentativeUserId ||
        parties.representedInstitutionId !== mandate.representedInstitutionId ||
        parties.holderUserId !== mandate.holderUserId || parties.holderUserId !== admission.actorUserId ||
        parties.holderCapacity !== mandate.holderCapacity ||
        parties.holderUserId === parties.issuerRepresentativeUserId)
      conflicts.push("PARTY_BINDING_CONFLICT");
  }

  if (!scope) incomplete.push("DELEGATION_SCOPE_MISSING");
  else if (scope.action !== "REGISTER_DRAFT_INSTRUMENT" ||
    scope.action !== mandate.action || scope.collectionKey !== admission.collectionKey ||
    scope.libraryReference !== admission.libraryReference || scope.sourceReference !== admission.sourceReference ||
    scope.sourceEdition !== admission.sourceEdition || admission.instrumentStatus !== "DRAFT" ||
    admission.versionStatus !== "DRAFT" ||
    scope.collectionKey !== mandate.collectionKey || scope.libraryReference !== mandate.libraryReference ||
    scope.sourceReference !== mandate.sourceReference || scope.sourceEdition !== mandate.sourceEdition)
    conflicts.push("DELEGATION_SCOPE_CONFLICT");

  if (!custody) incomplete.push("CUSTODY_VERIFICATION_MISSING");
  else {
    if (![custody.documentReference, custody.custodySourceId,
      custody.digestVerificationSourceId, custody.digestVerifierUserId].every(validId))
      incomplete.push("CUSTODY_SOURCE_INCOMPLETE");
    if (!validDigest(custody.recordedSha256) || !validDigest(custody.recomputedSha256))
      incomplete.push("CUSTODY_DIGEST_INVALID");
    else if (custody.recordedSha256.toLowerCase() !== custody.recomputedSha256.toLowerCase() ||
      custody.recordedSha256.toLowerCase() !== mandate.evidenceSha256.toLowerCase())
      conflicts.push("CUSTODY_DIGEST_CONFLICT");
    if (custody.documentReference !== mandate.evidenceReference ||
        custody.custodySourceId !== mandate.evidenceCustodyReference)
      conflicts.push("CUSTODY_REFERENCE_CONFLICT");
  }

  if (!verifier) incomplete.push("INDEPENDENT_VERIFIER_MISSING");
  else {
    if (![verifier.userId, verifier.institutionId, verifier.competenceSourceId,
      verifier.identitySourceId, verifier.independenceSourceId].every(validId))
      incomplete.push("VERIFIER_PROVENANCE_INCOMPLETE");
    if (verifier.userId === mandate.holderUserId ||
      verifier.userId === mandate.issuerRepresentativeUserId ||
      verifier.institutionId === mandate.issuerInstitutionId ||
      verifier.institutionId === mandate.representedInstitutionId ||
      (custody && custody.digestVerifierUserId !== verifier.userId))
      conflicts.push("VERIFIER_INDEPENDENCE_OR_BINDING_CONFLICT");
  }

  if (!lifecycle) incomplete.push("MANDATE_LIFECYCLE_MISSING");
  else {
    if (!validId(lifecycle.currentStateSourceId)) incomplete.push("LIFECYCLE_SOURCE_MISSING");
    if (lifecycle.mandateReference !== mandate.mandateReference ||
      lifecycle.effectiveAt !== mandate.effectiveAt ||
      lifecycle.expiresAt !== mandate.expiresAt ||
      [lifecycle.withdrawnAt, lifecycle.revokedAt, lifecycle.supersededAt, lifecycle.suspendedAt]
        .some(x => x !== null) || mandate.revokedAt !== null || mandate.supersededAt !== null)
      conflicts.push("MANDATE_LIFECYCLE_CONFLICT");
    const from = instant(lifecycle.effectiveAt);
    const end = lifecycle.expiresAt === null ? null : instant(lifecycle.expiresAt);
    if (from === null || from > at.getTime() ||
      (lifecycle.expiresAt !== null && (end === null || end <= at.getTime() || end <= from)))
      conflicts.push("MANDATE_LIFECYCLE_WINDOW_CONFLICT");
  }

  if (!Array.isArray(trail)) incomplete.push("PROVENANCE_TRAIL_MISSING");
  else {
    const seen = new Set<string>();
    for (const row of trail) {
      if (!row || !REQUIRED.includes(row.finding) ||
          ![row.recordId, row.sourceId, row.recorderUserId].every(validId) ||
          instant(row.observedAt) === null || instant(row.observedAt)! > at.getTime())
        incomplete.push("TRAIL_RECORD_INVALID");
      else if (seen.has(row.finding)) conflicts.push("DUPLICATE_TRAIL_FINDING");
      else seen.add(row.finding);
    }
    for (const finding of REQUIRED) if (!seen.has(finding))
      incomplete.push("TRAIL_FINDING_MISSING:" + finding);
    const bindings: Partial<Record<(typeof REQUIRED)[number], string | undefined>> = {
      ISSUER_COMPETENCE: power?.authoritySourceId,
      ISSUER_IDENTITY: parties?.issuerIdentitySourceId,
      HOLDER_BINDING: parties?.representationSourceId,
      SCOPE: lifecycle?.currentStateSourceId,
      CUSTODY_DIGEST: custody?.digestVerificationSourceId,
      VERIFIER_COMPETENCE: verifier?.competenceSourceId,
      LIFECYCLE: lifecycle?.currentStateSourceId,
    };
    for (const row of trail) {
      if (row && REQUIRED.includes(row.finding) &&
          bindings[row.finding] && row.sourceId !== bindings[row.finding])
        conflicts.push("TRAIL_SOURCE_BINDING_CONFLICT:" + row.finding);
    }
  }

  if (conflicts.length) return { standing: "SOURCE_CONFLICTED",
    reasons: [...new Set(conflicts)], operativeAuthorityEstablished: false, admissionAuthorized: false };
  if (incomplete.length) return { standing: "SOURCE_INCOMPLETE",
    reasons: [...new Set(incomplete)], operativeAuthorityEstablished: false, admissionAuthorized: false };
  return { standing: "INDEPENDENT_AUTHENTICATION_REQUIRED",
    reasons: ["CLAIMS_AND_SOURCE_REFERENCES_ARE_NOT_AUTHENTICATED_PROOF"],
    operativeAuthorityEstablished: false, admissionAuthorized: false };
}
