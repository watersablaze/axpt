export type CaseStage =
  | "CREATED"
  | "DOCUMENTS_PENDING"
  | "READY_FOR_ESCROW"
  | "ESCROW_IN_PROGRESS"
  | "ESCROW_COMPLETE"
  | "COMPLETED"
  | "AT_RISK"

type Event = {
  type: string
}

export function deriveCaseStage(events: Event[]): CaseStage {

  const types = events.map(e => e.type)

  // 🔴 risk overrides everything
  if (types.includes("RISK_ALERT") || types.includes("ESCROW_MISMATCH")) {
    return "AT_RISK"
  }

  // ✅ completed
  if (types.includes("CASE_COMPLETED")) {
    return "COMPLETED"
  }

  // 💰 escrow complete
  if (types.includes("ESCROW_RELEASED")) {
    return "ESCROW_COMPLETE"
  }

  // 🔒 escrow locked
  if (types.includes("ESCROW_LOCKED")) {
    return "ESCROW_IN_PROGRESS"
  }

  // 💸 escrow funded
  if (
    types.includes("ESCROW_FUNDED") ||
    types.includes("ESCROW_PARTIALLY_FUNDED")
  ) {
    return "ESCROW_IN_PROGRESS"
  }

  // 📄 documents done → ready for escrow
  if (
    types.includes("DOCUMENT_UPLOADED") &&
    !types.includes("ESCROW_PENDING")
  ) {
    return "READY_FOR_ESCROW"
  }

  // 📄 documents required
  if (types.includes("ARTIFACT_REQUIRED")) {
    return "DOCUMENTS_PENDING"
  }

  // 🟢 default
  return "CREATED"
}