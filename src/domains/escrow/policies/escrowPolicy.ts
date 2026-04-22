export function canLockEscrow(caseStatus: string) {

  return caseStatus === "ACTIVE"

}

export function canReleaseEscrow(caseStatus: string) {

  return caseStatus === "COMPLETED"

}