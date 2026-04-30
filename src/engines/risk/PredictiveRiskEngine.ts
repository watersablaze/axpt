import { prisma } from '@/infrastructure/db/prisma'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type RiskInput = {
  userId: string
  amountBaseUnits?: bigint
  assetCode?: string
}

export type RiskSignal = {
  score: number
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  reasons: string[]
}

export class PredictiveRiskEngine {
  /**
   * 🧠 MAIN ENTRYPOINT (AUTONOMOUS RISK COMPUTATION)
   */
  async evaluate(input: RiskInput): Promise<RiskSignal> {
    const { userId, amountBaseUnits } = input

    const [txs, escrows, disputes] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),

      prisma.escrow.findMany({
        where: {
          OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
      }),

      prisma.dispute.findMany({
        where: { userId },
      }),
    ])

    const velocityRisk = this.computeVelocityRisk(txs)
    const behaviorRisk = this.computeBehaviorRisk(txs)
    const transactionRisk = this.computeTransactionRisk(txs, amountBaseUnits)
    const escrowRisk = this.computeEscrowRisk(escrows)
    const disputeRisk = disputes.length * 0.2

    const score =
      velocityRisk * 0.3 +
      behaviorRisk * 0.3 +
      transactionRisk * 0.1 +
      escrowRisk * 0.2 +
      disputeRisk * 0.1

    return {
      score: Number(score.toFixed(4)),
      level: this.classify(score),
      reasons: this.explain(score, txs, escrows, disputes, transactionRisk),
    }
  }

  /**
   * ──────────────────────────────
   * SIGNAL 1: VELOCITY
   * ──────────────────────────────
   */
  private computeVelocityRisk(txs: any[]): number {
    if (!txs.length) return 0

    const now = Date.now()
    const windowMs = 5 * 60 * 1000

    const recent = txs.filter(
      (t) => now - new Date(t.createdAt).getTime() < windowMs
    )

    return Math.min(1, recent.length / 10)
  }

  /**
   * ──────────────────────────────
   * SIGNAL 2: BEHAVIOR SHIFT
   * ──────────────────────────────
   */
  private computeBehaviorRisk(txs: any[]): number {
    if (txs.length < 5) return 0.1

    const amounts = txs.map((t) => Number(t.amountBaseUnits))

    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const variance =
      amounts.reduce((a, b) => a + Math.abs(b - avg), 0) / amounts.length

    return Math.min(1, variance / (avg || 1))
  }

  /**
   * ──────────────────────────────
   * SIGNAL 3: TRANSACTION ANOMALY
   * ──────────────────────────────
   */
  private computeTransactionRisk(
    txs: any[],
    incoming?: bigint
  ): number {
    if (!incoming || txs.length < 3) return 0

    const amounts = txs.map((t) => Number(t.amountBaseUnits))
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length

    const incomingValue = Number(incoming)

    return Math.min(1, incomingValue / (avg || incomingValue || 1))
  }

  /**
   * ──────────────────────────────
   * ESCROW PRESSURE
   * ──────────────────────────────
   */
  private computeEscrowRisk(escrows: any[]): number {
    const open = escrows.filter(
      (e) => e.status !== 'SETTLED' && e.status !== 'RELEASED'
    )

    return Math.min(1, open.length / 5)
  }

  /**
   * ──────────────────────────────
   * CLASSIFICATION
   * ──────────────────────────────
   */
  private classify(score: number): RiskLevel {
    if (score < 0.2) return 'LOW'
    if (score < 0.5) return 'MEDIUM'
    if (score < 0.75) return 'HIGH'
    return 'CRITICAL'
  }

  /**
   * ──────────────────────────────
   * EXPLANATION ENGINE
   * ──────────────────────────────
   */
  private explain(
    score: number,
    txs: any[],
    escrows: any[],
    disputes: any[],
    transactionRisk: number
  ): string[] {
    const reasons: string[] = []

    if (txs.length > 20) reasons.push('High transaction frequency')
    if (escrows.length > 3) reasons.push('Escrow concentration risk')
    if (disputes.length > 0) reasons.push('Active dispute history')
    if (transactionRisk > 0.7)
      reasons.push('Incoming transfer exceeds historical baseline')
    if (score > 0.7) reasons.push('Behavioral instability detected')

    return reasons
  }
}
