/**
 * Non-authorizing French-Ward SCO commercial review record.
 * Records human disposition of one immutable 1B schedule snapshot.
 * No source allocation, payment, commercial approval, authority grant or issuance.
 */
import { createHash } from "node:crypto";
import type {
  BuyerSpecificScoCommercialSchedule, CommercialTermKey,
} from "./buyerSpecificScoCommercialSchedule";

export type DeviationDisposition = "ACCEPTABLE_FOR_FURTHER_REVIEW" | "REJECT" | "REQUEST_REVISION";
export type ReviewOutcome = "RECOMMEND_ADVANCEMENT" | "RETURN_FOR_REVISION" | "DECLINE";
export type DeviationReview = Readonly<{
  key: CommercialTermKey;
  disposition: DeviationDisposition;
  rationale: string;
}>;
export type CommercialReviewInput = Readonly<{
  reviewReference: string;
  reviewerIdentityReference: string;
  reviewedAt: string;
  outcome: ReviewOutcome;
  rationale: string;
  deviationReviews: readonly DeviationReview[];
}>;
export type BuyerScoCommercialReviewRecord = Readonly<{
  reviewReference: string;
  reviewedAt: string;
  reviewerIdentityReference: string;
  draftReference: string;
  buyerRequestReference: string;
  standingReference: string;
  standingEdition: number;
  standingContentHash: string;
  scheduleDigestSha256: string;
  outcome: ReviewOutcome;
  rationale: string;
  deviationReviews: readonly DeviationReview[];
  posture: "COMMERCIAL_REVIEW_RECORD_ONLY";
  sourceAllocation: "UNVERIFIED";
  approvedForUse: false;
  authorityGranted: false;
  issued: false;
}>;

function required(value: string, field: string): string {
  if (typeof value !== "string" || !value.trim() || value.length > 4000)
    throw new Error(`INVALID_${field}`);
  return value.trim();
}
/** Encodes the complete fixed-shape 1B schedule, not merely a reference or timestamp. */
export function fingerprintBuyerScoSchedule(schedule: BuyerSpecificScoCommercialSchedule): string {
  if (schedule.posture !== "DRAFT_FOR_COMMERCIAL_REVIEW" ||
      schedule.sourceAllocation !== "UNVERIFIED" ||
      schedule.commercialApproval !== null || schedule.issuanceAuthority !== null ||
      schedule.paymentInstructions !== null)
    throw new Error("INELIGIBLE_SCHEDULE");
  return createHash("sha256").update(JSON.stringify(schedule)).digest("hex");
}

/**
 * Human review recommendation only. No positive disposition substitutes for
 * independently evidenced source verification, approval or controlled issuance.
 */
export function recordBuyerScoCommercialReview(
  schedule: BuyerSpecificScoCommercialSchedule,
  input: CommercialReviewInput,
): BuyerScoCommercialReviewRecord {
  const scheduleDigestSha256 = fingerprintBuyerScoSchedule(schedule);
  const reviewReference = required(input.reviewReference, "REVIEW_REFERENCE");
  const reviewerIdentityReference = required(input.reviewerIdentityReference, "REVIEWER_IDENTITY");
  const reviewedAt = required(input.reviewedAt, "REVIEWED_AT");
  if (!Number.isFinite(Date.parse(reviewedAt)) || !/^\d{4}-\d{2}-\d{2}T/.test(reviewedAt))
    throw new Error("INVALID_REVIEWED_AT");
  const rationale = required(input.rationale, "REVIEW_RATIONALE");
  if (!["RECOMMEND_ADVANCEMENT", "RETURN_FOR_REVISION", "DECLINE"].includes(input.outcome))
    throw new Error("INVALID_OUTCOME");
  const expected = new Set(schedule.deviations.map(d => d.key));
  const seen = new Set<string>();
  const deviationReviews = input.deviationReviews.map(r => {
    if (!expected.has(r.key) || seen.has(r.key)) throw new Error("DEVIATION_REVIEW_MISMATCH");
    if (!["ACCEPTABLE_FOR_FURTHER_REVIEW", "REJECT", "REQUEST_REVISION"].includes(r.disposition))
      throw new Error("INVALID_DEVIATION_DISPOSITION");
    seen.add(r.key);
    return Object.freeze({key:r.key, disposition:r.disposition, rationale:required(r.rationale,"DEVIATION_RATIONALE")});
  });
  if (seen.size !== expected.size) throw new Error("INCOMPLETE_DEVIATION_REVIEW");
  if (input.outcome === "RECOMMEND_ADVANCEMENT" &&
      deviationReviews.some(r => r.disposition !== "ACCEPTABLE_FOR_FURTHER_REVIEW"))
    throw new Error("ADVANCEMENT_CONFLICTS_WITH_DEVIATIONS");
  if (input.outcome === "RETURN_FOR_REVISION" &&
      !deviationReviews.some(r => r.disposition === "REQUEST_REVISION") && expected.size > 0)
    throw new Error("REVISION_OUTCOME_WITHOUT_DEVIATION_REVISION");
  return Object.freeze({
    reviewReference,reviewedAt,reviewerIdentityReference,
    draftReference:schedule.draftReference,
    buyerRequestReference:schedule.buyerRequestReference,
    standingReference:schedule.standingReference,
    standingEdition:schedule.standingEdition,
    standingContentHash:schedule.standingContentHash,
    scheduleDigestSha256,
    outcome:input.outcome,rationale,
    deviationReviews:Object.freeze(deviationReviews),
    posture:"COMMERCIAL_REVIEW_RECORD_ONLY" as const,
    sourceAllocation:"UNVERIFIED" as const,
    approvedForUse:false as const,
    authorityGranted:false as const,
    issued:false as const,
  });
}

/** A changed schedule requires a new review; prior recommendations cannot be inherited. */
export function reviewMatchesExactSchedule(
  review: BuyerScoCommercialReviewRecord,
  schedule: BuyerSpecificScoCommercialSchedule,
): boolean {
  return review.draftReference === schedule.draftReference &&
    review.buyerRequestReference === schedule.buyerRequestReference &&
    review.standingReference === schedule.standingReference &&
    review.standingEdition === schedule.standingEdition &&
    review.standingContentHash === schedule.standingContentHash &&
    review.scheduleDigestSha256 === fingerprintBuyerScoSchedule(schedule);
}
