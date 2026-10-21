import assert from "node:assert/strict";
import { prepareBuyerSpecificScoDraft } from "../../src/domains/institutions/french-ward/buyerSpecificSoftCorporateOffer";
import { prepareBuyerScoCommercialSchedule } from "../../src/domains/institutions/french-ward/buyerSpecificScoCommercialSchedule";

const draft = prepareBuyerSpecificScoDraft(
  { reference:"FW-SCO-2026-001", edition:1, contentHash:"source-content-hash",
    commercialBaselineReference:"standing-terms-ed1" },
  {requestReference:"TEST-REQUEST-001",buyerLegalName:"Test Buyer LLC",
    buyerIdentityReference:"TEST-BUYER-001",kind:"PROGRAM",requestedQuantityKg:1000,
    destination:"Buyer nominated destination",
    proposedTrancheSchedule:[{quantityKg:250,proposedTiming:"Proposed tranche A"},
      {quantityKg:750,proposedTiming:"Proposed tranche B"}]},
  "TEST-DRAFT-001",
);
const schedule = prepareBuyerScoCommercialSchedule(draft,{
  pricingProposal:"Buyer requests separate pricing discussion",
  deviations:[{key:"PRICE_BASIS",proposedTerm:"Subject to negotiation",
    baselineProvisionReference:"standing-price-clause",
    reason:"Buyer requested a different commercial basis"}],
});
assert.equal(schedule.requestedQuantityKg,1000);
assert.equal(schedule.requestedTranches.reduce((n,t)=>n+t.quantityKg,0),1000);
assert.equal(schedule.standingContentHash,draft.baseline.contentHash);
assert.equal(schedule.sourceAllocation,"UNVERIFIED");
assert.equal(schedule.posture,"DRAFT_FOR_COMMERCIAL_REVIEW");
assert.equal(schedule.commercialApproval,null);
assert.equal(schedule.issuanceAuthority,null);
assert.equal(schedule.paymentInstructions,null);
assert.equal(schedule.deviations[0].reviewRequired,true);
assert.ok(Object.isFrozen(schedule));
assert.ok(Object.isFrozen(schedule.deviations));
assert.ok(Object.isFrozen(schedule.requestedTranches));
assert.throws(()=>prepareBuyerScoCommercialSchedule(draft,{deviations:[
  {key:"PRICE_BASIS",proposedTerm:"A",baselineProvisionReference:"B",reason:"C"},
  {key:"PRICE_BASIS",proposedTerm:"D",baselineProvisionReference:"E",reason:"F"}]}),
  /DUPLICATE_DEVIATION_KEY/);
assert.throws(()=>prepareBuyerScoCommercialSchedule(draft,{tapProposal:"  "}),/EMPTY_TAP/);
console.log("BUYER_SCO_COMMERCIAL_SCHEDULE_OK: 1000KG inquiry, proposed tranches, deviation held for review, no allocation/approval/issuance.");
