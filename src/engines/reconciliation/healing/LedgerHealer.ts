// src/engines/reconciliation/healing/LedgerHealer.ts

import { ReconciliationEngine } from '../ReconciliationEngine'
import { AXPTEventBus } from '../../events/AXPTEventBus'

export class LedgerHealer {
  private bus = new AXPTEventBus()
  private recon = new ReconciliationEngine()

  async heal(report: any) {
    /**
     * 1. FULL LEDGER REPLAY HEAL
     */
    if (!report.doubleEntry.isHealthy) {
      await this.rebuildLedgerTruth()
    }

    /**
     * 2. ESCROW HEAL
     */
    if (!report.escrow.isHealthy) {
      await this.rebuildEscrowState()
    }

    this.bus.emit({
      type: 'LEDGER_HEAL_COMPLETED',
      payload: {
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Rebuild balances purely from transactions
   */
  async rebuildLedgerTruth() {
    const result = await this.recon.runLedgerReplay()

    this.bus.emit({
      type: 'LEDGER_REPLAY_COMPLETED',
      payload: result,
    })

    return result
  }

  /**
   * Rebuild escrow from event history (future expansion)
   */
  async rebuildEscrowState() {
    this.bus.emit({
      type: 'ESCROW_REBUILD_TRIGGERED',
      payload: {},
    })
  }
}