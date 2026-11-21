import assert from "node:assert/strict";
import {prepareBuyerSpecificScoDraft} from "../../src/domains/institutions/french-ward/buyerSpecificSoftCorporateOffer";
import {prepareBuyerScoCommercialSchedule} from "../../src/domains/institutions/french-ward/buyerSpecificScoCommercialSchedule";
import {reconcileBuyerScoSourceEvidence} from "../../src/domains/institutions/french-ward/buyerSpecificScoSourceEvidence";
import {assessBuyerScoAllocationRegister} from "../../src/domains/institutions/french-ward/buyerSpecificScoAllocationRegister";
const draft=prepareBuyerSpecificScoDraft({reference:"FW-SCO-2026-001",edition:1,contentHash:"example",commercialBaselineReference:"BASE"},
{requestReference:"REQ-1",buyerLegalName:"Test Buyer",buyerIdentityReference:"BUYER-1",kind:"PROGRAM",requestedQuantityKg:1000},"DRAFT-1");
const schedule=prepareBuyerScoCommercialSchedule(draft);
const asOf="2026-10-22T10:00:00Z";
const source=reconcileBuyerScoSourceEvidence({asOf,schedule,capacityEvidence:[{
 evidenceReference:"E-1",sourceIdentityReference:"S-1",capacityScopeReference:"C-1",verificationState:"REVIEWED",
 reviewerIdentityReference:"REVIEWER-1",reviewedAt:"2026-10-21T10:00:00Z",validUntil:null,supportedCapacityKg:50}],
 scopeCommitmentLedger:[{commitmentReference:"COM-1",allocationAuthorityReference:"AUTH-1",allocationDocumentReference:"DOC-1",
 sourceIdentityReference:"S-1",capacityScopeReference:"C-1",buyerDraftReference:"DRAFT-1",committedQuantityKg:20,posture:"DOCUMENTED_COMMITMENT"}]});
const entry={entryReference:"ENTRY-1",commitmentReference:"COM-1",sourceIdentityReference:"S-1",capacityScopeReference:"C-1",
 buyerDraftReference:"DRAFT-1",quantityKg:20,authorityReference:"AUTH-1",authorityEvidenceReference:"DOC-1",
 effectiveAt:"2026-10-21T10:00:00Z",expiresAt:null,state:"DOCUMENTED" as const,supersedesEntryReference:null};
const snapshot={registerReference:"REG-1",asOf,scopeCompleteness:"COMPLETE_ASSERTED" as const,
 custodianIdentityReference:"CUSTODIAN-1",snapshotEvidenceReference:"SNAP-1",entries:[entry]};
const good=assessBuyerScoAllocationRegister(snapshot,source);
assert.equal(good.posture,"RECONCILABLE_EVIDENCE");
assert.equal(good.documentedToBuyerKg,20);
assert.equal(good.uncommittedRequestKg,980);
assert.equal(good.authoritativeAllocationGranted,false);
assert.equal(good.issuanceAuthorized,false);
assert.equal(good.settlementAuthorized,false);
assert.ok(Object.isFrozen(good));
const partial=assessBuyerScoAllocationRegister({...snapshot,scopeCompleteness:"PARTIAL"},source);
assert.equal(partial.posture,"REVIEW_REQUIRED");
assert.ok(partial.blockers.includes("REGISTER_COMPLETENESS_UNESTABLISHED"));
assert.throws(()=>assessBuyerScoAllocationRegister({...snapshot,entries:[entry,{...entry,entryReference:"ENTRY-2"}]},source),/DUPLICATE_ACTIVE_COMMITMENT/);
const mismatch=assessBuyerScoAllocationRegister({...snapshot,entries:[]},source);
assert.ok(mismatch.blockers.includes("BUYER_COMMITMENT_MISMATCH"));
assert.throws(()=>assessBuyerScoAllocationRegister({...snapshot,asOf:"2026-10-23T10:00:00Z"},source),/RECONCILIATION_AS_OF_MISMATCH/);
console.log("BUYER_SCO_ALLOCATION_REGISTER_OK: read-only snapshot matched 1D; partial/mismatched snapshots blocked; no allocation/issuance/settlement authority.");
