// src/engines/reconciliation/ReconciliationDaemon.ts

import { ReconciliationEngine } from './ReconciliationEngine'
import { LedgerHealer } from './healing/LedgerHealer'
import { AXPTEventBus } from '../events/AXPTEventBus'

export class ReconciliationDaemon {
  private recon = new ReconciliationEngine()
  private healer = new LedgerHealer()
  private bus = new AXPTEventBus()

  private interval: NodeJS.Timer | null = null

  start(ms = 60_000) {
    this.interval = setInterval(async () => {
      await this.run()
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

    if (!report.escrow.isHealthy || !report.doubleEntry.isHealthy) {
      await this.healer.heal(report)
    }
  }
}