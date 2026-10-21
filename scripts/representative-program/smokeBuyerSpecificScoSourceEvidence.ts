import assert from "node:assert/strict";
import {prepareBuyerSpecificScoDraft} from "../../src/domains/institutions/french-ward/buyerSpecificSoftCorporateOffer";
import {prepareBuyerScoCommercialSchedule} from "../../src/domains/institutions/french-ward/buyerSpecificScoCommercialSchedule";
import {reconcileBuyerScoSourceEvidence} from "../../src/domains/institutions/french-ward/buyerSpecificScoSourceEvidence";
const draft=prepareBuyerSpecificScoDraft({reference:"FW-SCO-2026-001",edition:1,contentHash:"samplehash",commercialBaselineReference:"terms"},
  {requestReference:"REQUEST-1",buyerLegalName:"Example Buyer",buyerIdentityReference:"BUYER-1",kind:"PROGRAM",requestedQuantityKg:1000},"DRAFT-1");
const schedule=prepareBuyerScoCommercialSchedule(draft);
const asOf="2026-10-22T10:00:00Z";
const evidence=[{evidenceReference:"E-50",sourceIdentityReference:"SOURCE-1",capacityScopeReference:"SCOPE-50",verificationState:"REVIEWED" as const,
 reviewerIdentityReference:"REVIEWER-1",reviewedAt:"2026-10-21T10:00:00Z",validUntil:"2026-11-30T00:00:00Z",supportedCapacityKg:50}];
const commitments=[{commitmentReference:"COMMIT-1",allocationAuthorityReference:"AUTH-1",allocationDocumentReference:"DOC-1",sourceIdentityReference:"SOURCE-1",
 capacityScopeReference:"SCOPE-50",buyerDraftReference:"DRAFT-1",committedQuantityKg:20,posture:"DOCUMENTED_COMMITMENT" as const}];
const data={asOf,schedule,capacityEvidence:evidence,scopeCommitmentLedger:commitments};
const result=reconcileBuyerScoSourceEvidence(data);
assert.equal(result.requestedQuantityKg,1000);
assert.equal(result.verifiedCapacityKg,50);
assert.equal(result.committedToBuyerKg,20);
assert.equal(result.uncoveredRequestKg,980);
assert.equal(result.sourceAllocationGranted,false);
assert.equal(result.commercialApprovalGranted,false);
assert.equal(result.issuanceAuthorized,false);
assert.ok(result.limitations.some(x=>x.includes("complete authoritative")));
assert.throws(()=>reconcileBuyerScoSourceEvidence({...data,scopeCommitmentLedger:[...commitments,commitments[0]]}),/DUPLICATE_COMMITMENT_REFERENCE/);
assert.throws(()=>reconcileBuyerScoSourceEvidence({...data,scopeCommitmentLedger:[...commitments,{...commitments[0],commitmentReference:"COMMIT-2",buyerDraftReference:"OTHER",committedQuantityKg:40}]}),/OVERCOMMITTED_CAPACITY_SCOPE/);
assert.throws(()=>reconcileBuyerScoSourceEvidence({...data,capacityEvidence:[...evidence,{...evidence[0],evidenceReference:"E-OTHER"}]}),/OVERLAPPING_CAPACITY_SCOPE/);
const noReview=reconcileBuyerScoSourceEvidence({...data,capacityEvidence:[{...evidence[0],verificationState:"UNREVIEWED" as const}],scopeCommitmentLedger:[]});
assert.equal(noReview.verifiedCapacityKg,0);
assert.equal(noReview.status,"INSUFFICIENT_EVIDENCE");
console.log("BUYER_SCO_SOURCE_EVIDENCE_OK: request 1000KG, verified scope 50KG, documented commitment 20KG, no auto-allocation/approval/issuance; duplicates and overcommitment rejected.");
