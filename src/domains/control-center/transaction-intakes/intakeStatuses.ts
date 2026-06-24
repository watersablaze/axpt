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

export const DEFAULT_TRANSACTION_INTAKE_HIDDEN_STATUSES = [
  "ARCHIVED",
  "TEST",
] as const;

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
