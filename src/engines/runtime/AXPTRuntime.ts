// src/engines/runtime/AXPTRuntime.ts

import { TransferEngine } from '../transfer/TransferEngine'
import { EscrowEngine } from '../escrow/EscrowEngine'
import { DisputeEngine } from '../dispute/DisputeEngine'
import { SettlementEngine } from '../settlement/SettlementEngine'
import { AXPTEventBus } from '../events/AXPTEventBus'

import type { TransferRequest, TransferResult } from '../transfer/TransferTypes'

export class AXPTRuntime {
  private transfer = new TransferEngine()
  private escrow = new EscrowEngine()
  private dispute = new DisputeEngine()
  private settlement = new SettlementEngine()
  private bus = new AXPTEventBus()

  /**
   * ──────────────────────────────
   * TRANSFER ENTRYPOINT
   * ──────────────────────────────
   */
  async executeTransfer(req: TransferRequest): Promise<TransferResult> {
    const result = await this.transfer.execute(req)

    this.bus.emit({
      type: 'TRANSFER_EXECUTED',
      payload: result,
    })

    /**
     * ESCROW FLOW (ONLY IF ENGINE DECLARES IT)
     */
    if (result.mode === 'ESCROW' && result.escrowId) {
      await this.escrow.transition({
        escrowId: result.escrowId,
        next: 'ACTIVE',
        actor: 'RUNTIME_KERNEL',
        metadata: {
          transferId: result.transferId,
        },
      })
    }

    return result
  }

  /**
   * ──────────────────────────────
   * DISPUTE ENTRYPOINT
   * ──────────────────────────────
   */
  async raiseDispute(input: {
    escrowId: string
    reason: string
    actor: string
  }) {
    this.bus.emit({
      type: 'DISPUTE_RAISED',
      payload: input,
    })

    return this.dispute.raise(input)
  }

  async resolveDispute(input: {
    escrowId: string
    decision: 'RELEASE' | 'REFUND' | 'SPLIT' | 'VOID'
    actor: string
  }) {
    const result = await this.dispute.resolve(input)

    this.bus.emit({
      type: 'DISPUTE_RESOLVED',
      payload: result,
    })

    return result
  }

  /**
   * ──────────────────────────────
   * SETTLEMENT FINALITY
   * ──────────────────────────────
   */
  async finalizeSettlement(input: {
    escrowId: string
    actor: string
  }) {
    const result = await this.settlement.finalize(input)

    this.bus.emit({
      type: 'SETTLEMENT_FINALIZED',
      payload: result,
    })

    return result
  }
}