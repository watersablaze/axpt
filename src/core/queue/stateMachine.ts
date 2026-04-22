export function getStateActions(caseRecord: any): string[] {
  const status = (caseRecord?.status || "").toUpperCase()

  switch (status) {
    case "DRAFT":
      return ["LOCK_ESCROW", "FLAG_REVIEW"]

    case "ESCROW_LOCKED":
      return ["RELEASE_ESCROW"]

    default:
      return []
  }
}