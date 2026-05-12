import { MemoryGraphEngine } from '@/engines/memory/MemoryGraphEngine'
import { ReconciliationEngine } from '@/engines/reconciliation/ReconciliationEngine'
import { LedgerReplayEngine } from '@/engines/replay/LedgerReplayEngine'
import type { LedgerReplayState } from '@/engines/replay/LedgerReplayEngine'
import type { CFState } from '@/engines/core/state/CFState'

export type AuditResult = {
  entityId: string
  isValid: boolean
  driftScore: number
  inconsistencies: string[]
  replaySnapshot: any
}

export class ExecutionAuditor {
  constructor(
    private memory: MemoryGraphEngine,
    private reconciliation: ReconciliationEngine,
    private replay: LedgerReplayEngine
  ) {}

  /**
   * 🧾 FULL SYSTEM AUDIT
   */
  async audit(entityId: string): Promise<AuditResult> {
    /**
     * 1. READ CANONICAL MEMORY STATE
     */
    const memoryState = await this.memory.replay(entityId, Date.now())

    /**
     * 2. REPLAY LEDGER STATE (SOURCE OF TRUTH)
     */
    const ledgerState = await this.replay.replay(entityId)

    /**
     * 4. DETECT STRUCTURAL INCONSISTENCIES
     */
    const inconsistencies = this.detectInconsistencies(
      memoryState,
      ledgerState
    )

    /**
     * 5. FINAL VALIDATION DECISION
     */
    const driftScore = this.computeDrift(memoryState, ledgerState)
    const isValid = inconsistencies.length === 0 && driftScore < 0.1

    return {
      entityId,
      isValid,
      driftScore,
      inconsistencies,
      replaySnapshot: {
        memoryState,
        ledgerState,
      },
    }
  }

  /**
   * 🧠 COMPARATIVE SYSTEM CHECK
   */
  private detectInconsistencies(
    memory: CFState,
    ledger: LedgerReplayState
  ): string[] {
    const issues: string[] = []

    if (memory.transfers.length !== ledger.transfers.length) {
      issues.push('MEMORY_LEDGER_MISMATCH')
    }

    if (memory.escrows.length !== ledger.escrows.length) {
      issues.push('ESCROW_STATE_MISMATCH')
    }

    if (memory.disputes.length !== ledger.disputes.length) {
      issues.push('DISPUTE_STATE_MISMATCH')
    }

    if (memory.settlements.length !== ledger.settlements.length) {
      issues.push('SETTLEMENT_STATE_MISMATCH')
    }

    return issues
  }

  private computeDrift(memory: CFState, ledger: LedgerReplayState): number {
    const checks = [
      memory.transfers.length === ledger.transfers.length,
      memory.escrows.length === ledger.escrows.length,
      memory.disputes.length === ledger.disputes.length,
      memory.settlements.length === ledger.settlements.length,
    ]

    const failures = checks.filter((check) => !check).length

    return failures / checks.length
  }
}
