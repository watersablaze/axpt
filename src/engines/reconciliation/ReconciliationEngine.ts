// src/engines/reconciliation/ReconciliationEngine.ts

import { prisma } from '@/infrastructure/db/prisma'
import { AXPTEventBus } from '../events/AXPTEventBus'

export class ReconciliationEngine {
  constructor(private bus = new AXPTEventBus()) {}

  /**
   * ──────────────────────────────
   * FULL LEDGER REPLAY
   * ──────────────────────────────
   */
  async runLedgerReplay(userId?: string) {
    const transactions = await prisma.transaction.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'asc' },
    })

    const balanceMap = new Map<string, bigint>()

    for (const tx of transactions) {
      const key = `${tx.userId}:${tx.assetCode}`

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

  /**
   * ──────────────────────────────
   * ESCROW CONSISTENCY CHECK
   * ──────────────────────────────
   */
  async validateEscrowIntegrity() {
    const escrows = await prisma.escrow.findMany()

    const issues: any[] = []

    for (const e of escrows) {
      if (e.status === 'INITIATED' && e.lockedAt) {
        issues.push({
          escrowId: e.id,
          issue: 'INITIATED_ESCROW_HAS_LOCK_TIMESTAMP',
        })
      }

      if (e.status === 'RELEASED' && !e.releasedAt) {
        issues.push({
          escrowId: e.id,
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

  /**
   * ──────────────────────────────
   * LEDGER PAIR VALIDATION
   * ──────────────────────────────
   */
  async validateDoubleEntry() {
    const txs = await prisma.transaction.findMany()

    const groups = new Map<string, number>()

    for (const tx of txs) {
      const key = tx.metadata?.journalGroupId

      if (!key) continue

      groups.set(key, (groups.get(key) ?? 0) + 1)
    }

    const broken = Array.from(groups.entries()).filter(
      ([_, count]) => count !== 2
    )

    return {
      totalGroups: groups.size,
      brokenGroups: broken.length,
      isHealthy: broken.length === 0,
    }
  }

  /**
   * ──────────────────────────────
   * MASTER HEALTH CHECK
   * ──────────────────────────────
   */
  async runFullReconciliation() {
    const ledger = await this.runLedgerReplay()
    const escrow = await this.validateEscrowIntegrity()
    const doubleEntry = await this.validateDoubleEntry()

    const report = {
      ledger,
      escrow,
      doubleEntry,
      timestamp: new Date().toISOString(),
    }

    this.bus.emit({
      type: 'RECONCILIATION_RUN',
      payload: report,
    })

    return report
  }
}