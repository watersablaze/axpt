import { organismSnapshotStore, ledgerReplayEngine } from "@/engines/runtime/serverSingletons"

/**
 * 🧠 REAL-TIME CHAIN ↔ ORGANISM ALIGNMENT LAYER
 */
export class AXPTReconciliationSyncEngine {

  /**
   * 🔁 FULL SYNC CHECK
   */
  async sync(caseId: string) {

    /**
     * 1. ON-CHAIN TRUTH
     */
    const chain = await ledgerReplayEngine.replay(caseId)

    /**
     * 2. ORGANISM TRUTH
     */
    const snapshots = organismSnapshotStore
      .getAll()
      .filter(s => s.state.caseId === caseId)

    const latest = snapshots.at(-1)

    if (!latest) return

    /**
     * 3. COMPUTE DRIFT
     */
    const drift = this.computeDrift(chain, latest.state)

    /**
     * 4. WRITE RECONCILIATION RESULT
     */
    return {
      caseId,
      drift,
      isAligned: drift < 0.05,
      chainState: chain,
      organismState: latest.state,
    }
  }

  /**
   * 📊 DRIFT MODEL
   */
  private computeDrift(chain: any, state: any): number {
    const deltas = [
      Math.abs(chain.transfers?.length ?? 0 - (state.amount ? 1 : 0)),
      Math.abs(chain.escrows?.length ?? 0),
      Math.abs(chain.disputes?.length ?? 0),
    ]

    return Math.min(1, deltas.reduce((a, b) => a + b, 0) / 10)
  }
}

/**
 * 🧬 SINGLETON
 */
export const reconciliationSyncEngine =
  new AXPTReconciliationSyncEngine()
