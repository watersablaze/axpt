import assert from "node:assert/strict";
import { test } from "node:test";
import { assessEcoNommoMandateCurrentness, type MandateCurrentnessRecord, type MandateCurrentnessSnapshot } from "./assessEcoNommoMandateCurrentness";
import type { EcoNommoMandateEvidenceCandidate } from "./assessEcoNommoMandateEvidence";

const at = new Date("2026-11-18T12:00:00.000Z");
const candidate = (): EcoNommoMandateEvidenceCandidate => ({
  mandateReference: "synthetic-mandate",
  issuerInstitutionId: "issuer-institution", issuerRepresentativeUserId: "issuer-user",
  representedInstitutionId: "represented-institution", holderUserId: "holder-user",
  holderCapacity: "DOCUMENTARY_ADMISSION", action: "REGISTER_DRAFT_INSTRUMENT",
  collectionKey: "ECO_NOMMO", libraryReference: "EN-00",
  sourceReference: "SYNTHETIC-001", sourceEdition: "Review 01",
  effectiveAt: "2026-11-01T00:00:00.000Z", expiresAt: "2026-12-01T00:00:00.000Z",
  revokedAt: null, supersededAt: null,
  evidenceReference: "evidence", evidenceCustodyReference: "custody",
  evidenceSha256: "ab".repeat(32), evidenceIssuerAuthenticationReference: "auth",
  evidenceIssuerCompetenceReference: "competence",
  evidenceHolderAcceptanceReference: "acceptance",
  evidenceIndependentVerifierReference: "verifier",
});
const record = (): MandateCurrentnessRecord => ({
  recordId: "record-one", mandateReference: "synthetic-mandate",
  issuerInstitutionId: "issuer-institution", representedInstitutionId: "represented-institution",
  holderUserId: "holder-user", action: "REGISTER_DRAFT_INSTRUMENT",
  collectionKey: "ECO_NOMMO", libraryReference: "EN-00",
  sourceReference: "SYNTHETIC-001", sourceEdition: "Review 01",
  effectiveAt: "2026-11-01T00:00:00.000Z", expiresAt: "2026-12-01T00:00:00.000Z",
  withdrawnAt: null, suspendedAt: null, revokedAt: null, supersededByReference: null,
  lifecycleSourceId: "canonical-lifecycle-source",
});
const snapshot = (records: readonly MandateCurrentnessRecord[] = [record()]): MandateCurrentnessSnapshot => ({
  records, sourceReference: "source-record-set", complete: true,
});
function check(
  s: MandateCurrentnessSnapshot | null, standing: "SOURCE_INCOMPLETE" | "SOURCE_CONFLICTED",
  reason: string, m = candidate(), when = at,
) {
  const outcome = assessEcoNommoMandateCurrentness(m, s, when);
  assert.equal(outcome.standing, standing);
  assert.ok(outcome.reasons.includes(reason), outcome.reasons.join(", "));
  assert.equal(outcome.mandateCurrent, false);
  assert.equal(outcome.operativeAuthorityEstablished, false);
  assert.equal(outcome.admissionAuthorized, false);
}
test("one structurally current record still cannot authenticate currentness", () => {
  assert.deepEqual(assessEcoNommoMandateCurrentness(candidate(), snapshot(), at), {
    standing: "CURRENTNESS_AUTHENTICATION_REQUIRED",
    reasons: ["SOURCE_COMPLETENESS_AND_CURRENTNESS_NOT_INDEPENDENTLY_AUTHENTICATED"],
    mandateCurrent: false, operativeAuthorityEstablished: false, admissionAuthorized: false,
  });
});
test("missing mandate, records and reported source completeness fail closed", () => {
  check(null, "SOURCE_INCOMPLETE", "MANDATE_OR_SNAPSHOT_MISSING");
  check(snapshot([]), "SOURCE_INCOMPLETE", "EXACT_MANDATE_NOT_FOUND");
  check({ ...snapshot(), complete: false }, "SOURCE_INCOMPLETE", "EXHAUSTIVE_SOURCE_NOT_ESTABLISHED");
  check({ ...snapshot(), sourceReference: "" }, "SOURCE_INCOMPLETE", "EXHAUSTIVE_SOURCE_NOT_ESTABLISHED");
  const r = assessEcoNommoMandateCurrentness(null, snapshot(), at);
  assert.equal(r.mandateCurrent, false);
  assert.equal(r.standing, "SOURCE_INCOMPLETE");
});
test("duplicate exact identity and duplicate record ID are conflicts", () => {
  check(snapshot([record(), { ...record(), recordId: "record-two" }]),
    "SOURCE_CONFLICTED", "DUPLICATE_MANDATE_REFERENCE");
  check(snapshot([record(), { ...record(), mandateReference: "other" }]),
    "SOURCE_CONFLICTED", "DUPLICATE_LIFECYCLE_RECORD_ID");
});
test("competing same-scope mandates are never resolved by newest or favorable row", () => {
  check(snapshot([record(), { ...record(), recordId: "other-row", mandateReference: "other-mandate" }]),
    "SOURCE_CONFLICTED", "COMPETING_SCOPE_RECORDS");
  check(snapshot([{ ...record(), revokedAt: "2026-11-10T00:00:00.000Z" },
    { ...record(), recordId: "other-row", mandateReference: "other-mandate", revokedAt: null }]),
    "SOURCE_CONFLICTED", "COMPETING_SCOPE_RECORDS");
});
test("withdrawn, suspended, revoked or superseded mandates are not current", () => {
  for (const name of ["withdrawnAt", "suspendedAt", "revokedAt"] as const)
    check(snapshot([{ ...record(), [name]: "2026-11-10T00:00:00.000Z" }]),
      "SOURCE_CONFLICTED", "MANDATE_TERMINATED_OR_SUSPENDED");
  check(snapshot([{ ...record(), supersededByReference: "replacement" }]),
    "SOURCE_CONFLICTED", "MANDATE_TERMINATED_OR_SUSPENDED");
});
test("future, expired and malformed lifecycle intervals fail closed", () => {
  check(snapshot([{ ...record(), effectiveAt: "2026-11-20T00:00:00.000Z" }]),
    "SOURCE_CONFLICTED", "MANDATE_NOT_YET_EFFECTIVE");
  check(snapshot([{ ...record(), expiresAt: "2026-11-17T00:00:00.000Z" }]),
    "SOURCE_CONFLICTED", "MANDATE_EXPIRED");
  check(snapshot([{ ...record(), expiresAt: "2026-10-31T00:00:00.000Z" }]),
    "SOURCE_CONFLICTED", "LIFECYCLE_INTERVAL_MALFORMED");
  check(snapshot([{ ...record(), revokedAt: "invalid" }]),
    "SOURCE_CONFLICTED", "LIFECYCLE_TERMINATION_MALFORMED");
});
test("exact mandate may not substitute another holder, institution, action or edition", () => {
  for (const changed of [
    { holderUserId: "other-holder" }, { issuerInstitutionId: "other-institution" },
    { action: "TRANSFER_FUNDS" }, { sourceEdition: "Review 02" },
  ])
    check(snapshot([{ ...record(), ...changed }]),
      "SOURCE_CONFLICTED", "EXACT_MANDATE_SOURCE_MISMATCH");
});
test("missing source provenance in any row is unresolved, not silently skipped", () => {
  check(snapshot([{ ...record(), lifecycleSourceId: "" }]),
    "SOURCE_INCOMPLETE", "LIFECYCLE_RECORD_INCOMPLETE");
  check(snapshot([record(), { ...record(), recordId: "other", mandateReference: "", sourceEdition: "Other" }]),
    "SOURCE_INCOMPLETE", "LIFECYCLE_RECORD_INCOMPLETE");
});
test("candidate revocation or supersession cannot be ignored", () => {
  const m = candidate();
  check(snapshot(), "SOURCE_CONFLICTED", "EXACT_MANDATE_SOURCE_MISMATCH",
    { ...m, revokedAt: "2026-11-10T00:00:00.000Z" });
  check(snapshot(), "SOURCE_CONFLICTED", "EXACT_MANDATE_SOURCE_MISMATCH",
    { ...m, supersededAt: "2026-11-10T00:00:00.000Z" });
});
test("invalid assessment time cannot produce current authority", () => {
  check(snapshot(), "SOURCE_CONFLICTED", "INVALID_ASSESSMENT_TIME",
    candidate(), new Date(NaN));
});
