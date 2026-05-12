export type ExecutionContract = {
  req: {
    idempotencyKey: string
    fromUserId: string
    toUserId: string
    assetCode: string
    amountBaseUnits: bigint
    metadata?: Record<string, any>
  }

  ctx: {
    escrowId?: string
    environment: "PROD" | "SIM" | "TEST"
    source: "API" | "SYSTEM" | "AGENT"
  }
}