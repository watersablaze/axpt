import { prisma } from '@/infrastructure/db/prisma'
import { AXPTDigitalTwinEngine } from '@/engines/twin/AXPTDigitalTwinEngine'
import type { CFReconciliationReport } from './types/CFReconciliationReport'

export type ReconciliationResult = {
  isConsistent: boolean
  driftScore: number
  anomalies: string[]
  correctedState?: any
}

export class ReconciliationEngine {
  constructor(
    private twin = new AXPTDigitalTwinEngine(
      // injected externally in runtime
      {} as any,
      {} as any,
      {} as any
    )
  ) {}

  /**
   * 🧠 CORE RECONCILIATION LOOP
   */
  async reconcile(caseId: string): Promise<ReconciliationResult> {
    /**
     * 1. FETCH REAL LEDGER STATE
     */
    const ledgerState = await this.loadLedgerState(caseId)

    /**
     * 2. RECONSTRUCT EXPECTED STATE VIA TWIN
     */
    const expected = await this.twin.simulate({
      transfer: await this.loadTransfers(caseId),
      escrow: await this.loadEscrows(caseId),
      dispute: await this.loadDisputes(caseId),
    })
    const expectedState = {
      riskScore: expected.riskScore,
      recommendation: expected.recommendation,
      timelines: expected.timelines,
    }

    /**
     * 3. COMPUTE DRIFT
     */
    const driftScore = this.computeDrift(
      ledgerState,
      expectedState
    )

    /**
     * 4. DETECT ANOMALIES
     */
    const anomalies = this.detectAnomalies(
      ledgerState,
      expectedState
    )

    /**
     * 5. FINAL CONSISTENCY CHECK
     */
    const isConsistent = driftScore < 0.05 && anomalies.length === 0

    /**
     * 6. OPTIONAL SELF-CORRECTION SIGNAL
     */
    const correctedState = !isConsistent
      ? this.generateCorrection(ledgerState, expectedState)
      : undefined

    return {
      isConsistent,
      driftScore,
      anomalies,
      correctedState,
    }
  }

  async runLedgerReplay(userId?: string) {
    const transactions = await prisma.transaction.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'asc' },
    })

    const balanceMap = new Map<string, bigint>()

    for (const tx of transactions) {
      const key = `${tx.userId}:${tx.assetCode ?? tx.tokenType ?? 'UNKNOWN'}`
      const current = balanceMap.get(key) ?? 0n
      const amount = BigInt(tx.amountBaseUnits ?? 0)

      if (tx.type === 'CREDIT') {
        balanceMap.set(key, current + amount)
      }

      if (tx.type === 'DEBIT') {
        balanceMap.set(key, current - amount)
      }
    }

    return {
      reconstructedBalances: Array.from(balanceMap.entries()).map(
        ([key, value]) => ({
          key,
          value: value.toString(),
        })
      ),
    }
  }

  async validateEscrowIntegrity() {
    const escrows = await prisma.escrow.findMany()
    const issues: any[] = []

    for (const escrow of escrows) {
      if (escrow.status === 'RELEASED' && !escrow.releasedAt) {
        issues.push({
          escrowId: escrow.id,
          issue: 'RELEASED_ESCROW_MISSING_RELEASE_TIMESTAMP',
        })
      }
    }

    return {
      totalEscrows: escrows.length,
      issues,
      isHealthy: issues.length === 0,
    }
  }

  async validateDoubleEntry() {
    const txs = await prisma.transaction.findMany()
    const groups = new Map<string, number>()

    for (const tx of txs) {
      const metadata = tx.metadata as any
      const key = metadata?.journalGroupId

      if (!key) continue

      groups.set(key, (groups.get(key) ?? 0) + 1)
    }

    const broken = Array.from(groups.entries()).filter(
      ([, count]) => count !== 2
    )

    return {
      totalGroups: groups.size,
      brokenGroups: broken.length,
      isHealthy: broken.length === 0,
    }
  }

  async runFullReconciliation(): Promise<CFReconciliationReport> {
    const ledger = await this.runLedgerReplay()
    const escrow = await this.validateEscrowIntegrity()
    const doubleEntry = await this.validateDoubleEntry()
    const ledgerDriftScore =
      doubleEntry.totalGroups > 0
        ? doubleEntry.brokenGroups / doubleEntry.totalGroups
        : 0
    
    return {
      ledger: {
        isHealthy: ledgerDriftScore <= 0.05,
        driftScore: ledgerDriftScore,
      },

      escrow: {
        isHealthy: escrow.isHealthy,
      },

      doubleEntry: {
        isHealthy: doubleEntry.isHealthy,
      },

      reconstructedBalances: ledger.reconstructedBalances,

      timestamp: Date.now(),
    }
  }

  async flagAnomaly(input: { userId: string; reason: string }) {
    return prisma.eventLog.create({
      data: {
        actor: input.userId,
        action: 'RECONCILIATION_ANOMALY',
        detail: input,
      },
    })
  }

  /**
   * ──────────────────────────────
   * LEDGER LOADERS
   * ──────────────────────────────
   */

  private async loadLedgerState(caseId: string) {
    const [tx, escrow] = await Promise.all([
      prisma.transaction.findMany({
        where: { metadata: { path: ['caseId'], equals: caseId } },
      }),
      prisma.escrow.findMany({
        where: { caseId },
      }),
    ])

    return { transactions: tx, escrows: escrow }
  }

  private async loadTransfers(caseId: string) {
    return prisma.transaction.findMany({
      where: { metadata: { path: ['caseId'], equals: caseId } },
    })
  }

  private async loadEscrows(caseId: string) {
    return prisma.escrow.findMany({
      where: { caseId },
    })
  }

  private async loadDisputes(caseId: string) {
    return prisma.caseEvent.findMany({
      where: {
        caseId,
        type: 'DISPUTE_RAISED',
      },
    })
  }

  /**
   * ──────────────────────────────
   * DRIFT MODEL
   * ──────────────────────────────
   */
  private computeDrift(actual: any, expected: any): number {
    const a = JSON.stringify(actual)
    const e = JSON.stringify(expected)

    let diff = 0

    for (let i = 0; i < Math.min(a.length, e.length); i++) {
      if (a[i] !== e[i]) diff++
    }

    return diff / Math.max(a.length, 1)
  }

  /**
   * ──────────────────────────────
   * ANOMALY DETECTOR
   * ──────────────────────────────
   */
  private detectAnomalies(actual: any, expected: any): string[] {
    const anomalies: string[] = []

    if (actual.transactions?.length !== expected.transactions?.length) {
      anomalies.push('TRANSACTION_COUNT_MISMATCH')
    }

    if (actual.escrows?.length !== expected.escrows?.length) {
      anomalies.push('ESCROW_COUNT_MISMATCH')
    }

    return anomalies
  }

  /**
   * ──────────────────────────────
   * SELF-CORRECTION SIGNAL
   * ──────────────────────────────
   */
  private generateCorrection(actual: any, expected: any) {
    return {
      recommendedAction: 'STATE_REHYDRATION',
      actual,
      expected,
    }
  }
}
