export type CompensationAction =
  | 'REVERSE'
  | 'OFFSET'
  | 'MARK_FAILED'

export class AXPTCompensationEngine {
  execute(input: {
    caseId: string
    action: CompensationAction
    reason: string
  }) {
    return {
      executed: true,
      caseId: input.caseId,
      action: input.action,
      reason: input.reason,
      timestamp: Date.now(),
    }
  }
}