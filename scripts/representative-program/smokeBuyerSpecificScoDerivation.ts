import { strict as assert } from "node:assert";
import { prepareBuyerSpecificScoDraft } from "../../src/domains/institutions/french-ward/buyerSpecificSoftCorporateOffer";
const standing = Object.freeze({
  reference: "FW-SCO-2026-001", edition: 1, contentHash: "test-baseline-hash", commercialBaselineReference: "standing-v1",
});
const program = prepareBuyerSpecificScoDraft(standing, {
  requestReference: "TEST-INQUIRY-001", buyerLegalName: "Test Buyer", buyerIdentityReference: "TEST-ENTITY-001",
  kind: "PROGRAM", requestedQuantityKg: 1000,
  proposedTrancheSchedule: [{ quantityKg: 500, proposedTiming: "subject to verification" }, { quantityKg: 500, proposedTiming: "subject to confirmation" }],
}, "TEST-DRAFT-001");
assert.equal(program.lifecycle, "DRAFT");
assert.equal(program.allocation.state, "UNVERIFIED");
assert.equal(program.approval, null);
assert.equal(program.recipientAccess, null);
assert.equal(program.issuedAt, null);
assert.equal(program.request.requestedQuantityKg, 1000);
assert.equal(standing.edition, 1);
assert.throws(() => prepareBuyerSpecificScoDraft(standing, {
  requestReference: "TEST-INQUIRY-002", buyerLegalName: "Test", buyerIdentityReference: "X", kind: "PROGRAM", requestedQuantityKg: 1000,
  proposedTrancheSchedule: [{ quantityKg: 500, proposedTiming: "trial" }],
}, "TEST-DRAFT-002"), /SCHEDULE_QUANTITY_MISMATCH/);
assert.throws(() => prepareBuyerSpecificScoDraft(standing, {
  requestReference: "TEST-INQUIRY-003", buyerLegalName: "Test", buyerIdentityReference: "X", kind: "TRANCHE", requestedQuantityKg: 0,
}, "TEST-DRAFT-003"), /INVALID_QUANTITY/);
console.log("BUYER_SCO_DERIVATION_FOUNDATION_OK: proposed 1000KG program, no allocation, approval, access or issuance; negative cases enforced.");
