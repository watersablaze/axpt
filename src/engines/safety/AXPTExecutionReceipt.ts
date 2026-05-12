export type ExecutionReceipt = {
  intentId: string

  stateBefore: string
  stateAfter: string

  chainTxHash?: string

  reconciliationHash?: string

  failureReason?: string

  timestamp: number
}

export function createReceipt(data: ExecutionReceipt) {
  return Object.freeze({
    ...data,
    timestamp: Date.now(),
  })
}