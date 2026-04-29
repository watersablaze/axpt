type Tx = any // Prisma.TransactionClient

type IdempotencyState = {
  key: string
  status: 'PENDING' | 'COMPLETED'
  response?: any
}

export class IdempotencyGuard {
  /**
   * CORE SAFETY LAYER
   * Prevents duplicate financial execution
   */
  async assert(tx: Tx, key?: string) {
    if (!key) return

    /**
     * 1. CHECK EXISTING RECORD
     */
    const existing = await tx.idempotencyRecord.findUnique({
      where: { key },
    })

    /**
     * 2. IF COMPLETED → RETURN IMMEDIATELY
     */
    if (existing?.status === 'COMPLETED') {
      throw new Error(
        JSON.stringify({
          code: 'IDEMPOTENT_REPLAY',
          response: existing.response,
        })
      )
    }

    /**
     * 3. IF EXISTS BUT PENDING → BLOCK (race condition protection)
     */
    if (existing?.status === 'PENDING') {
      throw new Error('IDEMPOTENCY_LOCKED')
    }

    /**
     * 4. CREATE LOCK RECORD (atomic reservation)
     */
    await tx.idempotencyRecord.create({
      data: {
        key,
        status: 'PENDING',
      },
    })
  }

  /**
   * CALLED AFTER SUCCESSFUL EXECUTION
   */
  async markCompleted(tx: Tx, key: string, response: any) {
    await tx.idempotencyRecord.update({
      where: { key },
      data: {
        status: 'COMPLETED',
        response,
        updatedAt: new Date(),
      },
    })
  }
}