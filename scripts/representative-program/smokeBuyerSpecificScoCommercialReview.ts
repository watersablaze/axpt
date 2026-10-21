import assert from "node:assert/strict";
import { prepareBuyerSpecificScoDraft } from "../../src/domains/institutions/french-ward/buyerSpecificSoftCorporateOffer";
import { prepareBuyerScoCommercialSchedule } from "../../src/domains/institutions/french-ward/buyerSpecificScoCommercialSchedule";
import {
  recordBuyerScoCommercialReview, reviewMatchesExactSchedule,
} from "../../src/domains/institutions/french-ward/buyerSpecificScoCommercialReview";

const draft = prepareBuyerSpecificScoDraft(
  {reference:"FW-SCO-2026-001",edition:1,contentHash:"baseline-edition-hash",commercialBaselineReference:"standing-terms-ed1"},
  {requestReference:"TEST-REQUEST-1000KG",buyerLegalName:"Test Program Buyer",buyerIdentityReference:"TEST-BUYER",kind:"PROGRAM",requestedQuantityKg:1000,
    proposedTrancheSchedule:[{quantityKg:250,proposedTiming:"Proposed first tranche"},{quantityKg:750,proposedTiming:"Proposed second tranche"}]},
  "TEST-DRAFT-1000KG",
);
const proposal={pricingProposal:"Buyer requests another price basis",deviations:[{
  key:"PRICE_BASIS" as const, proposedTerm:"Proposed alternative formula",baselineProvisionReference:"standing price provision",reason:"Buyer request",
}]};
const schedule=prepareBuyerScoCommercialSchedule(draft,proposal);
const base={reviewReference:"TEST-REVIEW-001",reviewerIdentityReference:"TEST-REVIEWER",
  reviewedAt:"2026-10-22T09:00:00+02:00",rationale:"Reviewed as a proposal only",outcome:"RECOMMEND_ADVANCEMENT" as const,
  deviationReviews:[{key:"PRICE_BASIS" as const,disposition:"ACCEPTABLE_FOR_FURTHER_REVIEW" as const,rationale:"Discuss further"}]};
const review=recordBuyerScoCommercialReview(schedule,base);
assert.equal(review.outcome,"RECOMMEND_ADVANCEMENT");
assert.equal(review.sourceAllocation,"UNVERIFIED");
assert.equal(review.approvedForUse,false);
assert.equal(review.authorityGranted,false);
assert.equal(review.issued,false);
assert.equal(review.deviationReviews.length,1);
assert.ok(Object.isFrozen(review));
assert.ok(Object.isFrozen(review.deviationReviews));
assert.ok(reviewMatchesExactSchedule(review,schedule));
const changed=prepareBuyerScoCommercialSchedule(draft,{...proposal,pricingProposal:"Changed price basis"});
assert.equal(reviewMatchesExactSchedule(review,changed),false);
assert.throws(()=>recordBuyerScoCommercialReview(schedule,{...base,deviationReviews:[]}),/INCOMPLETE_DEVIATION_REVIEW/);
assert.throws(()=>recordBuyerScoCommercialReview(schedule,{...base,deviationReviews:[...base.deviationReviews,...base.deviationReviews]}),/DEVIATION_REVIEW_MISMATCH/);
assert.throws(()=>recordBuyerScoCommercialReview(schedule,{...base,deviationReviews:[{...base.deviationReviews[0],disposition:"REJECT"}]}),/ADVANCEMENT_CONFLICTS_WITH_DEVIATIONS/);
const returned=recordBuyerScoCommercialReview(schedule,{...base,outcome:"RETURN_FOR_REVISION",deviationReviews:[{...base.deviationReviews[0],disposition:"REQUEST_REVISION"}]});
assert.equal(returned.outcome,"RETURN_FOR_REVISION");
console.log("BUYER_SCO_COMMERCIAL_REVIEW_OK: exact schedule bound; deviation disposition complete; changed schedule invalidates match; no allocation, approval, authority or issuance.");
