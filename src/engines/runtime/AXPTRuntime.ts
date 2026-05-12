// src/engines/runtime/AXPTRuntime.ts

import { TransferEngine } from '../execution/transfer/TransferEngine'
import { EscrowEngine } from '../execution/escrow/EscrowEngine'
import { DisputeEngine } from '../dispute/DisputeEngine'
import { SettlementEngine } from '../execution/settlement/SettlementEngine'
import { AXPTEventBus } from '../events/AXPTEventBus'
import { GovernanceMutationLedger } from '@/engines/governance/mutations/GovernanceMutationLedger'
import type { TransferRequest, TransferResult } from '../execution/transfer/TransferTypes'
import { AXPTBreathEngine } from './AXPTBreathEngine'
import { RuntimeCoherenceGuard } from './RuntimeCoherenceGuard'
import { ReconciliationEngine } from '@/engines/reconciliation/ReconciliationEngine'
import { MemoryGraphEngine } from '@/engines/memory/MemoryGraphEngine'

export class AXPTRuntime {
  private transfer = new TransferEngine()
  private escrow = new EscrowEngine()
  private dispute = new DisputeEngine()
  private settlement = new SettlementEngine()
  private bus = new AXPTEventBus()
  private mutationLedger = new GovernanceMutationLedger()
  private breath: AXPTBreathEngine
  private guard = new RuntimeCoherenceGuard()
  private memory = new MemoryGraphEngine()
  private reconciliation = new ReconciliationEngine()

  constructor() {
    this.breath = new AXPTBreathEngine(
      this.bus,
      this.reconciliation,
      this.mutationLedger
    )
  }

  /**
   * ──────────────────────────────
   * TRANSFER ENTRYPOINT
   * ──────────────────────────────
   */
  async executeTransfer(req: TransferRequest): Promise<TransferResult> {
    this.guard.validateEnvelope({
      req,
      ctx: null,
      twin: null,
      risk: null,
      decision: null,
    })

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

    return this.dispute.raise({
      escrowId: input.escrowId,
      reason: input.reason,
      raisedBy: input.actor,
    })
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
