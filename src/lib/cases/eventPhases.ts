export type Phase =
  | "CREATION"
  | "DOCUMENTS"
  | "ESCROW"
  | "COMPLETION"
  | "RISK"
  | "UNKNOWN"

export function getPhase(type: string): Phase {
  switch (type) {
    case "CASE_CREATED":
      return "CREATION"

    case "ARTIFACT_REQUIRED":
    case "DOCUMENT_UPLOADED":
      return "DOCUMENTS"

    case "ESCROW_PENDING":
    case "ESCROW_FUNDED":
    case "ESCROW_PARTIALLY_FUNDED":
    case "ESCROW_LOCKED":
    case "ESCROW_MISMATCH":
      return "ESCROW"

    case "ESCROW_RELEASED":
    case "CASE_COMPLETED":
      return "COMPLETION"

    case "RISK_ALERT":
      return "RISK"

    default:
      return "UNKNOWN"
  }
}