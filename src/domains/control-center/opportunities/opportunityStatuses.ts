import type {
  OpportunityStatus,
} from "./types";

export const OPPORTUNITY_REVIEW_STATUSES = [
  "INTAKE",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
] as const satisfies readonly OpportunityStatus[];

export type OpportunityReviewStatus =
  (typeof OPPORTUNITY_REVIEW_STATUSES)[number];

export const OPPORTUNITY_SYSTEM_STATUSES = [
  "PROMOTED",
] as const satisfies readonly OpportunityStatus[];

const REVIEW_TRANSITIONS: Record<
  OpportunityReviewStatus,
  readonly OpportunityReviewStatus[]
> = {
  INTAKE: [
    "UNDER_REVIEW",
    "ARCHIVED",
  ],

  UNDER_REVIEW: [
    "APPROVED",
    "REJECTED",
    "ARCHIVED",
  ],

  APPROVED: [
    "UNDER_REVIEW",
    "ARCHIVED",
  ],

  REJECTED: [
    "UNDER_REVIEW",
    "ARCHIVED",
  ],

  ARCHIVED: [
    "UNDER_REVIEW",
  ],
};

export function isOpportunityReviewStatus(
  status: string,
): status is OpportunityReviewStatus {
  return OPPORTUNITY_REVIEW_STATUSES.includes(
    status as OpportunityReviewStatus,
  );
}

export function isOpportunitySystemStatus(
  status: string,
) {
  return OPPORTUNITY_SYSTEM_STATUSES.includes(
    status as (typeof OPPORTUNITY_SYSTEM_STATUSES)[number],
  );
}

export function canTransitionOpportunityReviewStatus(
  fromStatus: string,
  toStatus: string,
) {
  if (
    !isOpportunityReviewStatus(fromStatus) ||
    !isOpportunityReviewStatus(toStatus)
  ) {
    return false;
  }

  if (fromStatus === toStatus) {
    return true;
  }

  return REVIEW_TRANSITIONS[fromStatus].includes(toStatus);
}

export function getAllowedOpportunityReviewTransitions(
  status: string,
): readonly OpportunityReviewStatus[] {
  if (!isOpportunityReviewStatus(status)) {
    return [];
  }

  return REVIEW_TRANSITIONS[status];
}
