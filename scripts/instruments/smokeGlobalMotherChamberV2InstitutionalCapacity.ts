import assert from "node:assert/strict";
import {
  resolveChamberV2InstitutionalCapacity,
  type ChamberV2CapacityEvidence,
} from "../../src/domains/instruments/global-mother/resolveChamberV2InstitutionalCapacity";

const at = new Date("2026-10-28T12:00:00.000Z");
const claim = {
  userId: "user-exact",
  institutionId: "institution-exact",
  capacity: "authorized-delegate",
};

const evidence: ChamberV2CapacityEvidence = {
  subjectUserId: claim.userId,
  institutionId: claim.institutionId,
  capacity: claim.capacity,
  sourceKind: "INDEPENDENT_INSTITUTIONAL_MANDATE",
  sourceInstrumentReference: "MANDATE-EXTERNAL-001",
  evidenceReference: "EVIDENCE-001",
  issuerInstitutionId: "issuer-exact",
  issuerAuthorityReference: "ISSUER-AUTHORITY-001",
  verifierUserId: "verifier-exact",
  verifiedAt: new Date("2026-10-26T12:00:00.000Z"),
  effectiveAt: new Date("2026-10-27T12:00:00.000Z"),
  expiresAt: new Date("2026-11-28T12:00:00.000Z"),
  revokedAt: null,
};

function assess(records: readonly ChamberV2CapacityEvidence[], c = claim, t = at) {
  return resolveChamberV2InstitutionalCapacity({ claim: c, evidence: records, at: t });
}
function expect(standing: string, reason: string, records: readonly ChamberV2CapacityEvidence[]) {
  const outcome = assess(records);
  assert.equal(outcome.standing, standing, reason);
  assert.equal(outcome.reason, reason);
  assert.equal(outcome.operationallyUsable, false);
}

expect("VERIFIED", "SUPPLIED_SNAPSHOT_LOGICALLY_VALID", [evidence]);
expect("UNVERIFIED", "EXACT_INSTITUTIONAL_CAPACITY_NOT_FOUND", []);
expect("UNVERIFIED", "EXACT_INSTITUTIONAL_CAPACITY_NOT_FOUND", [{ ...evidence, subjectUserId: "other" }]);
expect("UNVERIFIED", "EXACT_INSTITUTIONAL_CAPACITY_NOT_FOUND", [{ ...evidence, institutionId: "other" }]);
expect("UNVERIFIED", "EXACT_INSTITUTIONAL_CAPACITY_NOT_FOUND", [{ ...evidence, capacity: "other" }]);
expect("UNVERIFIED", "UNSUPPORTED_OR_INCOMPLETE_PROVENANCE", [{ ...evidence, evidenceReference: "" }]);
expect("UNVERIFIED", "UNSUPPORTED_OR_INCOMPLETE_PROVENANCE", [{ ...evidence, issuerAuthorityReference: "" }]);
expect("UNVERIFIED", "UNSUPPORTED_OR_INCOMPLETE_PROVENANCE", [{ ...evidence, issuerInstitutionId: "" }]);
expect("UNVERIFIED", "UNSUPPORTED_OR_INCOMPLETE_PROVENANCE", [{ ...evidence, verifierUserId: "" }]);
expect("UNVERIFIED", "UNSUPPORTED_OR_INCOMPLETE_PROVENANCE", [{ ...evidence, sourceKind: "CHAMBER_ADMISSION" }]);
expect("UNVERIFIED", "UNSUPPORTED_OR_INCOMPLETE_PROVENANCE", [{ ...evidence, sourceKind: "INSTITUTIONAL_ACCESS_GRANT" }]);
expect("UNVERIFIED", "UNSUPPORTED_OR_INCOMPLETE_PROVENANCE", [{ ...evidence, sourceKind: "SOURCE_AUTHORITY_PROFILE" }]);
expect("UNVERIFIED", "SELF_REFERENTIAL_CHAMBER_PROVENANCE", [{ ...evidence, evidenceReference: "GM-CHAMBER-001" }]);
expect("UNVERIFIED", "SELF_REFERENTIAL_CHAMBER_PROVENANCE", [{ ...evidence, sourceInstrumentReference: "GM-CHAMBER-001" }]);
expect("UNVERIFIED", "NOT_YET_EFFECTIVE", [{ ...evidence, effectiveAt: new Date("2026-10-29T00:00:00Z") }]);
expect("UNVERIFIED", "SOURCE_AUTHORITY_EXPIRED", [{ ...evidence, expiresAt: at }]);
expect("UNVERIFIED", "VERIFICATION_IN_FUTURE", [{ ...evidence, verifiedAt: new Date("2026-10-29T00:00:00Z") }]);
expect("REVOKED", "SOURCE_AUTHORITY_REVOKED", [{ ...evidence, revokedAt: new Date("2026-10-28T10:00:00Z") }]);
expect("CONFLICTED", "MULTIPLE_CAPACITY_ASSERTIONS", [evidence, { ...evidence, evidenceReference: "EVIDENCE-002" }]);
assert.equal(assess([evidence], claim, new Date("invalid")).standing, "UNVERIFIED");
assert.equal(assess([evidence]).operationallyUsable, false);
console.log("GM-V2.1B.2B.1: 21 deterministic assertions passed; no authority conferred.");
