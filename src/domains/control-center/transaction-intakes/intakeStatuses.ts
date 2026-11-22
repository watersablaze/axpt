export const TRANSACTION_INTAKE_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "QUALIFIED",
  "NEEDS_CLARIFICATION",
  "NOT_ALIGNED",
  "PROMOTED_TO_OPPORTUNITY",
  "DOSSIER_READY",
  "PROMOTED_TO_DOSSIER",
  "ARCHIVED",
  "TEST",
] as const;

export type TransactionIntakeStatus =
  (typeof TRANSACTION_INTAKE_STATUSES)[number];

/**
 * Human review dispositions.
 *
 * These states may be assigned through the administrative review surface.
 * Promotion / downstream lifecycle states are deliberately excluded because
 * they must be produced by the operations that create the corresponding
 * downstream records.
 */
export const TRANSACTION_INTAKE_REVIEW_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "NEEDS_CLARIFICATION",
  "QUALIFIED",
  "NOT_ALIGNED",
  "ARCHIVED",
] as const;

export type TransactionIntakeReviewStatus =
  (typeof TRANSACTION_INTAKE_REVIEW_STATUSES)[number];

/**
 * Lifecycle states owned by system operations rather than manual review.
 */
export const TRANSACTION_INTAKE_SYSTEM_STATUSES = [
  "PROMOTED_TO_OPPORTUNITY",
  "DOSSIER_READY",
  "PROMOTED_TO_DOSSIER",
  "TEST",
] as const;

export const DEFAULT_TRANSACTION_INTAKE_HIDDEN_STATUSES = [
  "ARCHIVED",
  "TEST",
] as const;

const REVIEW_TRANSITIONS: Record<
  TransactionIntakeReviewStatus,
  readonly TransactionIntakeReviewStatus[]
> = {
  SUBMITTED: [
    "UNDER_REVIEW",
    "NEEDS_CLARIFICATION",
    "NOT_ALIGNED",
    "ARCHIVED",
  ],

  UNDER_REVIEW: [
    "NEEDS_CLARIFICATION",
    "QUALIFIED",
    "NOT_ALIGNED",
    "ARCHIVED",
  ],

  NEEDS_CLARIFICATION: [
    "UNDER_REVIEW",
    "QUALIFIED",
    "NOT_ALIGNED",
    "ARCHIVED",
  ],

  QUALIFIED: [
    "UNDER_REVIEW",
    "NEEDS_CLARIFICATION",
    "NOT_ALIGNED",
    "ARCHIVED",
  ],

  NOT_ALIGNED: [
    "UNDER_REVIEW",
    "ARCHIVED",
  ],

  ARCHIVED: [
    "UNDER_REVIEW",
  ],
};

export function getTransactionIntakeStatusLabel(status: string | null) {
  switch (status) {
    case "SUBMITTED":
      return "Submitted";
    case "UNDER_REVIEW":
      return "Under Review";
    case "QUALIFIED":
      return "Qualified";
    case "NEEDS_CLARIFICATION":
      return "Needs Clarification";
    case "NOT_ALIGNED":
      return "Not Aligned";
    case "PROMOTED_TO_OPPORTUNITY":
      return "Promoted to Opportunity";
    case "DOSSIER_READY":
      return "Dossier Ready";
    case "PROMOTED_TO_DOSSIER":
      return "Promoted to Dossier";
    case "ARCHIVED":
      return "Archived";
    case "TEST":
      return "Test";
    default:
      return status || "Unknown";
  }
}

export function getTransactionIntakeStatusTone(status: string | null) {
  switch (status) {
    case "SUBMITTED":
      return "border-sky-400/40 bg-sky-400/10 text-sky-200";
    case "UNDER_REVIEW":
      return "border-amber-400/40 bg-amber-400/10 text-amber-200";
    case "QUALIFIED":
      return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
    case "NEEDS_CLARIFICATION":
      return "border-yellow-400/40 bg-yellow-400/10 text-yellow-200";
    case "NOT_ALIGNED":
      return "border-red-400/40 bg-red-400/10 text-red-200";
    case "PROMOTED_TO_OPPORTUNITY":
    case "DOSSIER_READY":
    case "PROMOTED_TO_DOSSIER":
      return "border-violet-400/40 bg-violet-400/10 text-violet-200";
    case "ARCHIVED":
      return "border-gray-600/50 bg-gray-800/50 text-gray-300";
    case "TEST":
      return "border-purple-400/40 bg-purple-400/10 text-purple-200";
    default:
      return "border-white/15 bg-white/5 text-white/70";
  }
}

export function isTransactionIntakeStatus(
  status: string,
): status is TransactionIntakeStatus {
  return TRANSACTION_INTAKE_STATUSES.includes(
    status as TransactionIntakeStatus,
  );
}

export function isTransactionIntakeReviewStatus(
  status: string,
): status is TransactionIntakeReviewStatus {
  return TRANSACTION_INTAKE_REVIEW_STATUSES.includes(
    status as TransactionIntakeReviewStatus,
  );
}

export function isTransactionIntakeSystemStatus(
  status: string,
) {
  return TRANSACTION_INTAKE_SYSTEM_STATUSES.includes(
    status as (typeof TRANSACTION_INTAKE_SYSTEM_STATUSES)[number],
  );
}

export function canTransitionTransactionIntakeReviewStatus(
  fromStatus: string,
  toStatus: string,
) {
  if (
    !isTransactionIntakeReviewStatus(fromStatus) ||
    !isTransactionIntakeReviewStatus(toStatus)
  ) {
    return false;
  }

  if (fromStatus === toStatus) {
    return true;
  }

  return REVIEW_TRANSITIONS[fromStatus].includes(toStatus);
}

export function getAllowedTransactionIntakeReviewTransitions(
  status: string,
): readonly TransactionIntakeReviewStatus[] {
  if (!isTransactionIntakeReviewStatus(status)) {
    return [];
  }

  return [status, ...REVIEW_TRANSITIONS[status]];
}
