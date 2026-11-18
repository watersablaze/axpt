/**
 * ECN-REG-1C.2D.3 — pure, negative-only mandate currentness contract.
 * Records must be independently loaded as a COMPLETE competing source set,
 * not selected by the requestor. complete=true is an UNAUTHENTICATED claim;
 * this module never certifies source completeness, mandate truth or authority.
 * No DB access, grants, registration or positive operative result.
 */
import type { EcoNommoMandateEvidenceCandidate } from "./assessEcoNommoMandateEvidence";

export type MandateCurrentnessRecord = Readonly<{
  recordId: string;
  mandateReference: string;
  issuerInstitutionId: string;
  representedInstitutionId: string;
  holderUserId: string;
  action: string;
  collectionKey: string;
  libraryReference: string;
  sourceReference: string;
  sourceEdition: string;
  effectiveAt: string;
  expiresAt: string | null;
  withdrawnAt: string | null;
  suspendedAt: string | null;
  revokedAt: string | null;
  supersededByReference: string | null;
  lifecycleSourceId: string;
}>;
export type MandateCurrentnessSnapshot = Readonly<{
  records: readonly MandateCurrentnessRecord[];
  sourceReference: string;
  // This is merely a reported property and never accepted as proof of an
  // exhaustive, canonical, race-free read from the authoritative source.
  complete: boolean;
}>;
export type MandateCurrentnessDecision = Readonly<{
  standing: "SOURCE_INCOMPLETE" | "SOURCE_CONFLICTED" | "CURRENTNESS_AUTHENTICATION_REQUIRED";
  reasons: readonly string[];
  mandateCurrent: false;
  operativeAuthorityEstablished: false;
  admissionAuthorized: false;
}>;
const filled = (x: unknown): x is string => typeof x === "string" &&
  x.length > 0 && x.length <= 256 && x.trim() === x &&
  !/[\u0000-\u001f\u007f]/.test(x);
const instant = (x: unknown): number | null => {
  if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x)) return null;
  const d = new Date(x); return Number.isFinite(d.getTime()) && d.toISOString() === x ? d.getTime() : null;
};
const sameScope = (a: MandateCurrentnessRecord, m: EcoNommoMandateEvidenceCandidate) =>
  a.issuerInstitutionId === m.issuerInstitutionId &&
  a.representedInstitutionId === m.representedInstitutionId &&
  a.holderUserId === m.holderUserId && a.action === m.action &&
  a.collectionKey === m.collectionKey && a.libraryReference === m.libraryReference &&
  a.sourceReference === m.sourceReference && a.sourceEdition === m.sourceEdition;

/** No ordering, latest-record wins, or apparently favorable record selection. */
export function assessEcoNommoMandateCurrentness(
  mandate: EcoNommoMandateEvidenceCandidate | null | undefined,
  snapshot: MandateCurrentnessSnapshot | null | undefined,
  at: Date,
): MandateCurrentnessDecision {
  const result = (standing: MandateCurrentnessDecision["standing"], reasons: readonly string[]): MandateCurrentnessDecision => ({
    standing, reasons: [...new Set(reasons)], mandateCurrent: false,
    operativeAuthorityEstablished: false, admissionAuthorized: false,
  });
  if (!(at instanceof Date) || !Number.isFinite(at.getTime()))
    return result("SOURCE_CONFLICTED", ["INVALID_ASSESSMENT_TIME"]);
  if (!mandate || !snapshot) return result("SOURCE_INCOMPLETE", ["MANDATE_OR_SNAPSHOT_MISSING"]);
  if (!filled(snapshot.sourceReference) || !Array.isArray(snapshot.records) ||
    snapshot.complete !== true) return result("SOURCE_INCOMPLETE", ["EXHAUSTIVE_SOURCE_NOT_ESTABLISHED"]);
  const incomplete: string[] = [], conflicted: string[] = [];
  if (!filled(mandate.mandateReference)) incomplete.push("MANDATE_REFERENCE_INVALID");
  const exact = snapshot.records.filter(r => r && r.mandateReference === mandate.mandateReference);
  if (exact.length === 0) incomplete.push("EXACT_MANDATE_NOT_FOUND");
  if (exact.length > 1) conflicted.push("DUPLICATE_MANDATE_REFERENCE");
  const seenIds = new Set<string>();
  for (const r of snapshot.records) {
    if (!r || ![r.recordId, r.mandateReference, r.lifecycleSourceId,
      r.issuerInstitutionId, r.representedInstitutionId, r.holderUserId,
      r.action, r.collectionKey, r.libraryReference, r.sourceReference,
      r.sourceEdition].every(filled)) {
      incomplete.push("LIFECYCLE_RECORD_INCOMPLETE");
      continue;
    }
    if (seenIds.has(r.recordId)) conflicted.push("DUPLICATE_LIFECYCLE_RECORD_ID");
    seenIds.add(r.recordId);
    const from = instant(r.effectiveAt);
    const to = r.expiresAt === null ? null : instant(r.expiresAt);
    if (from === null || (r.expiresAt !== null && (to === null || (from !== null && to <= from))))
      conflicted.push("LIFECYCLE_INTERVAL_MALFORMED");
    for (const field of [r.withdrawnAt, r.suspendedAt, r.revokedAt]) {
      if (field !== null && instant(field) === null)
        conflicted.push("LIFECYCLE_TERMINATION_MALFORMED");
    }
    if (r.supersededByReference !== null && !filled(r.supersededByReference))
      conflicted.push("LIFECYCLE_SUPERSESSION_MALFORMED");
    if (r.mandateReference === mandate.mandateReference) {
      if (!sameScope(r, mandate) || r.effectiveAt !== mandate.effectiveAt ||
        r.expiresAt !== mandate.expiresAt ||
        r.revokedAt !== mandate.revokedAt ||
        mandate.supersededAt !== null)
        conflicted.push("EXACT_MANDATE_SOURCE_MISMATCH");
      if (r.withdrawnAt !== null || r.suspendedAt !== null ||
        r.revokedAt !== null || r.supersededByReference !== null)
        conflicted.push("MANDATE_TERMINATED_OR_SUSPENDED");
      if (from !== null && from > at.getTime()) conflicted.push("MANDATE_NOT_YET_EFFECTIVE");
      if (to !== null && to <= at.getTime()) conflicted.push("MANDATE_EXPIRED");
    }
  }
  // Every same-scope record competes, even revoked, expired, or malformed
  // ones; never silently select the apparently valid record from ambiguity.
  if (snapshot.records.filter(r => r && sameScope(r, mandate)).length > 1)
    conflicted.push("COMPETING_SCOPE_RECORDS");
  if (conflicted.length) return result("SOURCE_CONFLICTED", conflicted);
  if (incomplete.length) return result("SOURCE_INCOMPLETE", incomplete);
  return result("CURRENTNESS_AUTHENTICATION_REQUIRED",
    ["SOURCE_COMPLETENESS_AND_CURRENTNESS_NOT_INDEPENDENTLY_AUTHENTICATED"]);
}
