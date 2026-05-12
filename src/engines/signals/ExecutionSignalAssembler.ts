// src/engines/signals/ExecutionSignalAssembler.ts

import { executionGovernance } from "@/engines/governance/ExecutionGovernanceLayer"
import { reconciliationEngine } from "@/engines/runtime/serverSingletons"
import { treasuryAutonomyEngine } from "@/engines/treasury/TreasuryAutonomyEngine"

import { EscrowReplayEngine } from "@/engines/execution/escrow/EscrowReplayEngine"
import { EscrowStateMachine } from "@/engines/execution/escrow/escrowStateMachine"
import { OnchainReplayDivergenceEngine } from "@/engines/execution/escrow/OnChainReplayDivergenceEngine"

import { temporalStateEngine } from "@/engines/temporal/TemporalStateEngine"
import { executionCollapsePredictor } from "@/engines/predictor/ExecutionCollapsePredictor"
import { operatorTraceLedger } from "@/engines/operator/OperatorTraceLedger"

import type {
  ExecutionSignal,
  ExecutionSignalSource,
} from "@/engines/contracts/ExecutionContracts"

type ContractedEvent = {
  type: string
  timestamp: number
  payload?: any
  escrowId?: string
  amount?: number | bigint
  wallet?: string
  entityId?: string
  [key: string]: any
}

export class ExecutionSignalAssembler {

  private escrowEventBuffer = new Map<string, any[]>()
  private divergenceEngine = new OnchainReplayDivergenceEngine()
  private escrowReplay = new EscrowReplayEngine(new EscrowStateMachine())

  /**
   * 🧠 MAIN BUILD PIPELINE
   */
  async build(
    entityId: string,
    event: ContractedEvent
  ): Promise<ExecutionSignal[]> {

    this.buffer(event)

    // ─────────────────────────────
    // 1. BASE SYSTEM SIGNALS
    // ─────────────────────────────

    const reconciliation = await this.collectReconciliationSignal(entityId)
    const replay = this.collectReplaySignal(entityId)
    const divergence = this.collectDivergenceSignal(entityId, replay, event)
    const governance = this.collectGovernanceSignal(event)
    const risk = this.collectRiskSignal(entityId)

    // ─────────────────────────────
    // 2. TEMPORAL STATE INJECTION
    // ─────────────────────────────

    const temporal = temporalStateEngine.build(entityId)

    const driftSignal: ExecutionSignal = {
      source: "DRIFT",
      type: "TEMPORAL_DRIFT",
      severity: temporal.drift.acceleration,
      confidence: 1,
      timestamp: Date.now(),
    }

    const finalitySignal: ExecutionSignal = {
      source: "FINALITY",
      type: "TEMPORAL_FINALITY",
      severity: 1 - temporal.stability.latest,
      confidence: 1,
      timestamp: Date.now(),
    }

    // ─────────────────────────────
    // 3. COLLAPSE PREDICTION INJECTION
    // ─────────────────────────────

    const collapse =
      executionCollapsePredictor.predict(entityId)

    const collapseSignal: ExecutionSignal = {
      source: "SIMULATION",
      type: "COLLAPSE_PREDICTION",
      severity: collapse.collapseRisk,
      confidence: collapse.confidence,
      timestamp: Date.now(),
      payload: collapse,
    }

    // ─────────────────────────────
    // 4. OPERATOR FIELD INJECTION
    // ─────────────────────────────

    const operatorTraces =
      operatorTraceLedger.getAll(entityId)

    const operatorDrift =
      operatorTraces.reduce((a, b) => a + b.driftContribution, 0) /
      (operatorTraces.length || 1)

    const operatorAlignment =
      operatorTraces.reduce((a, b) => a + b.stabilityDelta, 0) /
      (operatorTraces.length || 1)

    const operatorSignal: ExecutionSignal = {
      source: "SYSTEM",
      type: "OPERATOR_FIELD",
      severity: operatorDrift,
      confidence: Math.min(1, operatorAlignment + 0.5),
      timestamp: Date.now(),
      payload: {
        drift: operatorDrift,
        alignment: operatorAlignment,
      },
    }

    // ─────────────────────────────
    // 5. RETURN FULL SIGNAL SET
    // ─────────────────────────────

    return [
      reconciliation,
      replay,
      divergence,
      governance,
      risk,

      driftSignal,
      finalitySignal,
      collapseSignal,
      operatorSignal,
    ]
  }

  // ─────────────────────────────
  // BUFFERING
  // ─────────────────────────────

  private buffer(event: ContractedEvent) {
    if (!event.escrowId) return

    const list = this.escrowEventBuffer.get(event.escrowId) ?? []

    list.push({
      id: crypto.randomUUID(),
      type: event.type,
      escrowId: event.escrowId,
      timestamp: Date.now(),
    })

    this.escrowEventBuffer.set(event.escrowId, list)
  }

  // ─────────────────────────────
  // EXISTING SIGNALS (UNCHANGED LOGIC)
  // ─────────────────────────────

  private async collectReconciliationSignal(entityId: string): Promise<ExecutionSignal> {
    return this.normalizeSignal(await reconciliationEngine.reconcileSignal(entityId))
  }

  private collectReplaySignal(entityId: string): ExecutionSignal {
    const events = this.escrowEventBuffer.get(entityId) ?? []
    return this.normalizeSignal(this.escrowReplay.replaySignal(events))
  }

  private collectDivergenceSignal(entityId: string, replaySignal: any, event: ContractedEvent): ExecutionSignal {
    const replayPayload = replaySignal.payload as { finalState?: string } | undefined
    const chainState =
      event.type === "CHAIN_ESCROW_CONFIRMED" ? "FUNDS_LOCKED" : null

    const divergence = this.divergenceEngine.compare({
      escrowId: entityId,
      replayState: replaySignal.replayState ?? replaySignal.state ?? replayPayload?.finalState ?? null,
      chainState,
    })

    return this.normalizeSignal({
      source: "DIVERGENCE",
      type: divergence.status,
      severity: this.mapDivergenceSeverity(divergence.severity),
      confidence: 1,
      timestamp: Date.now(),
      payload: divergence,
      replayState: divergence.replayState,
      state: divergence.chainState,
    })
  }

  private collectGovernanceSignal(event: ContractedEvent): ExecutionSignal {
    const normalized = event

    const g = executionGovernance.evaluateSignal(normalized)

    return this.normalizeSignal({
      source: "GOVERNANCE",
      type: g.type ?? "POLICY",
      severity: g.severity ?? 0,
      confidence: g.confidence ?? 1,
      timestamp: Date.now(),
      payload: g,
    })
  }

  private collectRiskSignal(entityId: string): ExecutionSignal {
    return this.normalizeSignal(treasuryAutonomyEngine.riskSignal(entityId))
  }

  private mapDivergenceSeverity(severity: string) {
    switch (severity) {
      case "CRITICAL":
        return 1
      case "HIGH":
        return 0.75
      case "MEDIUM":
        return 0.5
      case "LOW":
      default:
        return 0
    }
  }

  private normalizeSignal(signal: ExecutionSignal): ExecutionSignal {
    return {
      ...signal,
      source: signal.source as ExecutionSignalSource,
      type: signal.type || "UNKNOWN",
      severity: this.clamp01(signal.severity),
      confidence: this.clamp01(signal.confidence),
      timestamp: signal.timestamp || Date.now(),
    }
  }

  private clamp01(value: number) {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(1, value))
  }
}

export const executionSignalAssembler =
  new ExecutionSignalAssembler()

export const SignalAssembler = executionSignalAssembler
