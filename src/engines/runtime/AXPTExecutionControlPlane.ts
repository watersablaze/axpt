import { ExecutionGovernorV2 } from '@/engines/governance/ExecutionGovernorV2'
import { AXPTDigitalTwinEngine } from '@/engines/twin/AXPTDigitalTwinEngine'
import { TransferEngine } from '@/engines/execution/transfer/TransferEngine'
import { EscrowEngine } from '@/engines/execution/escrow/EscrowEngine'
import { MemoryGraphEngine } from '@/engines/memory/MemoryGraphEngine'
import { ReconciliationEngine } from '@/engines/reconciliation/ReconciliationEngine'
import { AXPTEventBus } from '@/engines/events/AXPTEventBus'
import { TransferValidator } from '@/engines/execution/transfer/TransferValidator'
import { PredictiveRiskEngine } from '@/engines/risk/PredictiveRiskEngine'
import { RuntimeCoherenceGuard } from './RuntimeCoherenceGuard'

import type { TransferRequest } from '@/engines/execution/transfer/TransferTypes'
import type { TwinResult } from '@/engines/twin/AXPTDigitalTwinEngine'
import type { RiskSignal } from '@/engines/risk/PredictiveRiskEngine'
import type { GovernorResult } from '@/engines/governance/types'
import { GovernanceMutationLedger } from '@/engines/governance/mutations/GovernanceMutationLedger'
import { GovernanceEvolutionEngine } from '@/engines/governance/GovernanceEvolutionEngine'

import { AXPTBreathVisualizer } from './AXPTBreathVisualizer'

/**
 * 🧬 AXPT EXECUTION CONTROL PLANE V2
 * Fully deterministic financial nervous system
 */
export class AXPTExecutionControlPlane {
  private validator = new TransferValidator()
  private guard = new RuntimeCoherenceGuard()
  private breath = new AXPTBreathVisualizer()
  private mutationLedger = new GovernanceMutationLedger()
  private evolutionEngine: GovernanceEvolutionEngine

  constructor(
    private governor: ExecutionGovernorV2,
    private twin: AXPTDigitalTwinEngine,
    private transfer: TransferEngine,
    private escrow: EscrowEngine,
    private memory: MemoryGraphEngine,
    private reconciliation: ReconciliationEngine,
    private bus: AXPTEventBus,
    private risk: PredictiveRiskEngine = new PredictiveRiskEngine()
  ) {
    this.evolutionEngine = new GovernanceEvolutionEngine(
      this.memory,
      this.reconciliation,
      this.mutationLedger
    )
  }

  /**
   * 🧠 PRIMARY ORCHESTRATION LOOP
   */
  async execute(req: TransferRequest) {
    this.breath.pulse({ phase: 'INHALE' })

    const executionReq = {
      ...req,
      idempotencyKey: req.idempotencyKey ?? crypto.randomUUID(),
    }

    /**
     * ──────────────────────────────
     * 1. VALIDATION LAYER
     * ──────────────────────────────
     */
    const ctx = this.validator.validate(executionReq)

    const executionCtx = {
      ...ctx,
      environment: "SIM" as const,
      source: "SYSTEM" as const,
    }

    /**
     * ──────────────────────────────
     * 2. TWIN SIMULATION
     * ──────────────────────────────
     */
    const twin: TwinResult = await this.twin.simulate({
      transfer: executionReq,
    })

    /**
     * ──────────────────────────────
     * 3. RISK ANALYSIS
     * ──────────────────────────────
     */
    const risk: RiskSignal = await this.risk.evaluate({
      userId: ctx.fromUserId,
      amountBaseUnits: ctx.amountBaseUnits,
      assetCode: ctx.assetCode,
    })

    this.breath.pulse({
      phase: 'SIMULATE',
      risk: risk.score,
    })

    /**
     * ──────────────────────────────
     * 4. GOVERNANCE DECISION
     * ──────────────────────────────
     */
    const decision: GovernorResult = await this.governor.evaluate({
      req: {
        idempotencyKey: executionReq.idempotencyKey,
        fromUserId: ctx.fromUserId,
        toUserId: ctx.toUserId,
        assetCode: ctx.assetCode,
        amountBaseUnits: ctx.amountBaseUnits,
        metadata: ctx.metadata,
      },
      ctx: executionCtx,
      twin,
      risk,
    })

    this.breath.pulse({
      phase: 'DECIDE',
      risk: risk.score,
      drift: 0,
    })

    /**
     * 🧬 COHERENCE GATE
     */
  const coherence = this.guard.validateEnvelope({
    req: executionReq,
    ctx: executionCtx,
    twin,
    risk,
    decision,
    })

    if (!coherence.ok) {
    this.bus.emit({
      type: 'COHERENCE_BLOCKED',
      payload: coherence,
    })

    throw new Error('COHERENCE_GATE_BLOCKED')
    }

    /**
     * 🧠 PRE-EXECUTION EVENT
     */
    this.bus.emit({
      type: 'EXECUTION_PREVIEW',
      payload: {
        decision,
        twin,
        risk,
      },
    })

    /**
     * ──────────────────────────────
     * 5. EXECUTION ROUTER
     * ──────────────────────────────
     */
    this.breath.pulse({ phase: 'EXECUTE' })

    const result = await this.route(decision, executionReq)

    /**
     * ──────────────────────────────
     * 6. POST-STATE VERIFICATION
     * ──────────────────────────────
     */
    const postState = await this.reconciliation.runFullReconciliation()

    this.breath.pulse({
      phase: 'VERIFY',
      drift: postState.ledger.driftScore ?? 0,
    })

    this.breath.pulse({ phase: 'HEAL' })

    const evolution =
  await this.evolutionEngine.evolve(
    executionCtx.fromUserId
  )

    this.bus.emit({
      type: 'GOVERNANCE_EVALUATION_COMPLETED',
      payload: evolution,
    })

    this.bus.emit({
      type: 'EXECUTION_FINALIZED',
      payload: {
        result,
        postState,
      },
    })

    this.breath.pulse({ phase: 'EXHALE' })

    return result
  }

  /**
   * 🧭 ROUTING LAYER
   */
    private async route(
      decision: GovernorResult,
      req: TransferRequest
    ) {
      switch (decision.decision) {

        case 'TRANSFER':
          return this.transfer.execute(req)

        case 'ESCROW':
          return this.transfer.execute({
            ...req,
            metadata: {
              ...req.metadata,
              forcedMode: 'ESCROW',
            },
          })

        case 'REJECT':
          throw new Error(
            `EXECUTION_REJECTED: ${decision.reason}`
          )

        case 'QUARANTINE':
          await this.handleQuarantine(req)

          throw new Error(
            'SYSTEM_QUARANTINE_ACTIVE'
          )

        default:
          throw new Error(
            'UNKNOWN_GOVERNOR_DECISION'
          )
      }
    }

  /**
   * 🧬 IMMUNE RESPONSE
   */
  private async handleQuarantine(req: TransferRequest) {
    this.bus.emit({
      type: 'SYSTEM_QUARANTINE_TRIGGERED',
      payload: req,
    })

    await this.reconciliation.flagAnomaly({
      userId: req.fromUserId,
      reason: 'AUTOMATIC_QUARANTINE',
    })
  }
}
