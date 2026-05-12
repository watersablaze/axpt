export type ExecutionState =
  | 'QUEUED'
  | 'VALIDATED'
  | 'APPROVED'
  | 'ONCHAIN_PENDING'
  | 'ONCHAIN_CONFIRMED'
  | 'RECONCILED'
  | 'FAILED'
  | 'ROLLED_BACK'

const validTransitions: Record<ExecutionState, ExecutionState[]> = {
  QUEUED: ['VALIDATED', 'FAILED'],
  VALIDATED: ['APPROVED', 'FAILED'],
  APPROVED: ['ONCHAIN_PENDING', 'FAILED'],
  ONCHAIN_PENDING: ['ONCHAIN_CONFIRMED', 'FAILED'],
  ONCHAIN_CONFIRMED: ['RECONCILED', 'FAILED'],
  RECONCILED: [],
  FAILED: ['ROLLED_BACK'],
  ROLLED_BACK: [],
}

export class AXPTExecutionStateMachine {
  private state: ExecutionState = 'QUEUED'

  getState() {
    return this.state
  }

  transition(next: ExecutionState) {
    const allowed = validTransitions[this.state]

    if (!allowed.includes(next)) {
      throw new Error(
        `INVALID_STATE_TRANSITION: ${this.state} → ${next}`
      )
    }

    this.state = next
  }
}