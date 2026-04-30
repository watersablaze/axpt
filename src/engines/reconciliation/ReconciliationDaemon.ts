import { ReconciliationEngine } from './ReconciliationEngine'
import { LedgerHealer } from './healing/LedgerHealer'
import { LedgerReplayEngine } from '../replay/LedgerReplayEngine'
import { MemoryGraphEngine } from '../memory/MemoryGraphEngine'
import { AXPTEventBus } from '../events/AXPTEventBus'

export class ReconciliationDaemon {
  private recon = new ReconciliationEngine()
  private healer = new LedgerHealer()
  private replay = new LedgerReplayEngine()
  private memory = new MemoryGraphEngine()
  private bus = new AXPTEventBus()

  private interval: NodeJS.Timeout | null = null

  start(ms = 60_000) {
    if (this.interval) return

    this.interval = setInterval(() => {
      this.run().catch((err) => {
        this.bus.emit({
          type: 'RECONCILIATION_DRIFT_DETECTED',
          payload: { error: err.message },
        })
      })
    }, ms)
  }

  stop() {
    if (this.interval) clearInterval(this.interval)
  }

  async run() {
    const report = await this.recon.runFullReconciliation()

    this.bus.emit({
      type: 'RECONCILIATION_TICK',
      payload: report,
    })

    const drift =
      !report.ledger.isHealthy ||
      !report.escrow.isHealthy ||
      !report.doubleEntry.isHealthy ||
      report.ledger.driftScore > 0.05

    if (!drift) return

    /**
     * 1. SIMPLE REPLAY (NO ORCHESTRATED WRAPPER)
     */
    const replayFix = await this.replay.replay('SYSTEM')

    /**
     * 2. DIRECT HEALING (NO CAUSAL WRAPPER YET)
     */
    const healing = await this.healer.heal({
      report,
      replayFix,
    } as any)

    /**
     * 3. MEMORY LOG
     */
    await this.memory.ingest({
      id: crypto.randomUUID(),
      type: 'SETTLEMENT',
      entityId: 'SYSTEM',
      timestamp: Date.now(),

      stateBefore: report,
      stateAfter: healing,

      delta: {
        healed: true,
      },

      metadata: {
        origin: 'RECONCILIATION_DAEMON',
      },
    } as any)

    this.bus.emit({
      type: 'LEDGER_HEAL_COMPLETED',
      payload: healing,
    })
  }
}