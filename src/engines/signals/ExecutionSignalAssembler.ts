// src/engines/signals/ExecutionSignalAssembler.ts

import crypto from "crypto"

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

import type { EscrowStatus } from "@/domains/escrow/escrowStatus"
import type { EscrowEventRecord, EscrowEventType } from "@/engines/execution/escrow/EscrowReplayEngine"

type ContractedEvent = {
  type: string
  timestamp: number
  escrowId?: string
  amount?: number | bigint
  wallet?: string
  entityId?: string
  replayState?: EscrowStatus
  chainState?: EscrowStatus
  state?: EscrowStatus
  status?: EscrowStatus
  [key: string]: unknown
}

const SIGNAL_SOURCE = {
  COGNITION: "COGNITION",
  DRIFT: "DRIFT",
  RISK: "RISK",
  RECONCILIATION: "RECONCILIATION",
  DIVERGENCE: "DIVERGENCE",
  WALLET: "WALLET",
  TREASURY: "TREASURY",
  ETK: "ETK",
  INTENT: "INTENT",
  REPLAY: "REPLAY",
  FINALITY: "FINALITY",
  SIMULATION: "SIMULATION",
  SYSTEM: "SYSTEM",
  GOVERNANCE: "GOVERNANCE",
} as const satisfies Record<string, ExecutionSignalSource>

const ESCROW_EVENT_TYPE_MAP: Record<string, EscrowEventType> = {
  INITIATE: "INITIATE",
  ESCROW_INITIATED: "INITIATE",

  LOCK_FUNDS: "LOCK_FUNDS",
  FUNDS_LOCKED: "LOCK_FUNDS",
  CHAIN_ESCROW_CONFIRMED: "LOCK_FUNDS",

  DISPUTE: "DISPUTE",
  ESCROW_DISPUTED: "DISPUTE",

  ARBITRATE: "ARBITRATE",
  ESCROW_ARBITRATED: "ARBITRATE",

  RELEASE: "RELEASE",
  ESCROW_RELEASED: "RELEASE",

  SETTLE: "SETTLE",
  ESCROW_SETTLED: "SETTLE",

  CANCEL: "CANCEL",
  ESCROW_CANCELLED: "CANCEL",
}

export class ExecutionSignalAssembler {
  private escrowEventBuffer = new Map<string, EscrowEventRecord[]>()
  private divergenceEngine = new OnchainReplayDivergenceEngine()
  private escrowReplay = new EscrowReplayEngine(new EscrowStateMachine())

  /**
   * MAIN BUILD PIPELINE
   *
   * Emits canonical ExecutionSignal[] only:
   * id, source, entityId, severity, confidence, timestamp
   */
  async build(
    entityId: string,
    event: ContractedEvent
  ): Promise<ExecutionSignal[]> {
    this.buffer(event)

    const reconciliation = await this.collectReconciliationSignal(entityId)
    const replay = this.collectReplaySignal(entityId)
    const divergence = this.collectDivergenceSignal(entityId, event)
    const governance = this.collectGovernanceSignal(entityId, event)
    const risk = this.collectRiskSignal(entityId)

    const temporal = temporalStateEngine.build(entityId)

    const driftSignal = this.createSignal({
      source: SIGNAL_SOURCE.DRIFT,
      entityId,
      severity: temporal.drift.acceleration,
      confidence: 1,
    })

    const finalitySignal = this.createSignal({
      source: SIGNAL_SOURCE.FINALITY,
      entityId,
      severity: 1 - temporal.stability.latest,
      confidence: 1,
    })

    const collapse = executionCollapsePredictor.predict(entityId)

    const collapseSignal = this.createSignal({
      source: SIGNAL_SOURCE.SIMULATION,
      entityId,
      severity: collapse.collapseRisk,
      confidence: collapse.confidence,
    })

    const operatorTraces = operatorTraceLedger.getAll(entityId)

    const operatorDrift =
      operatorTraces.reduce((sum, trace) => sum + trace.driftContribution, 0) /
      (operatorTraces.length || 1)

    const operatorAlignment =
      operatorTraces.reduce((sum, trace) => sum + trace.stabilityDelta, 0) /
      (operatorTraces.length || 1)

    const operatorSignal = this.createSignal({
      source: SIGNAL_SOURCE.COGNITION,
      entityId,
      severity: operatorDrift,
      confidence: Math.min(1, operatorAlignment + 0.5),
    })

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

  private buffer(event: ContractedEvent): void {
    if (!event.escrowId) return

    const escrowEventType = ESCROW_EVENT_TYPE_MAP[event.type]

    if (!escrowEventType) return

    const list = this.escrowEventBuffer.get(event.escrowId) ?? []

    list.push({
      id: crypto.randomUUID(),
      type: escrowEventType,
      escrowId: event.escrowId,
      timestamp: Date.now(),
    })

    this.escrowEventBuffer.set(event.escrowId, list)
  }

  private async collectReconciliationSignal(
    entityId: string
  ): Promise<ExecutionSignal> {
    const raw = await reconciliationEngine.reconcileSignal(entityId)

    return this.normalizeSignal(raw, {
      source: SIGNAL_SOURCE.RECONCILIATION,
      entityId,
    })
  }

  private collectReplaySignal(entityId: string): ExecutionSignal {
    const events = this.escrowEventBuffer.get(entityId) ?? []
    const raw = this.escrowReplay.replaySignal(events)

    return this.normalizeSignal(raw, {
      source: SIGNAL_SOURCE.REPLAY,
      entityId,
    })
  }

  private collectDivergenceSignal(
    entityId: string,
    event: ContractedEvent
  ): ExecutionSignal {
    const divergence = this.divergenceEngine.compare({
      escrowId: entityId,
      replayState: this.deriveReplayState(event),
      chainState: this.deriveChainState(event),
    })

    return this.createSignal({
      source: SIGNAL_SOURCE.DIVERGENCE,
      entityId,
      severity: this.mapDivergenceSeverity(divergence.severity),
      confidence: 1,
    })
  }

  private collectGovernanceSignal(
    entityId: string,
    event: ContractedEvent
  ): ExecutionSignal {
    const raw = executionGovernance.evaluateSignal({
      ...event,
      entityId,
    })

    return this.normalizeSignal(raw, {
      source: SIGNAL_SOURCE.GOVERNANCE,
      entityId,
    })
  }

  private collectRiskSignal(entityId: string): ExecutionSignal {
    const raw = treasuryAutonomyEngine.riskSignal(entityId)

    return this.normalizeSignal(raw, {
      source: SIGNAL_SOURCE.RISK,
      entityId,
    })
  }

  private deriveReplayState(event: ContractedEvent): EscrowStatus | null {
    return (
      this.readEscrowStatus(event.replayState) ??
      this.readEscrowStatus(event.state) ??
      this.readEscrowStatus(event.status) ??
      null
    )
  }

  private deriveChainState(event: ContractedEvent): EscrowStatus | null {
    if (event.type === "CHAIN_ESCROW_CONFIRMED") {
      return "FUNDS_LOCKED"
    }

    return this.readEscrowStatus(event.chainState) ?? null
  }

  private readEscrowStatus(value: unknown): EscrowStatus | null {
    if (
      value === "INITIATED" ||
      value === "ACTIVE" ||
      value === "FUNDS_LOCKED" ||
      value === "DISPUTED" ||
      value === "ARBITRATED" ||
      value === "RELEASED" ||
      value === "SETTLED" ||
      value === "CANCELLED"
    ) {
      return value
    }

    return null
  }

  private normalizeSignal(
    raw: unknown,
    fallback: {
      source: ExecutionSignalSource
      entityId: string
    }
  ): ExecutionSignal {
    const record =
      raw && typeof raw === "object"
        ? (raw as Partial<ExecutionSignal>)
        : {}

    return {
      id: this.readString(record.id) ?? crypto.randomUUID(),
      source: this.isExecutionSignalSource(record.source)
        ? record.source
        : fallback.source,
      entityId: this.readString(record.entityId) ?? fallback.entityId,
      severity: this.clamp01(
        typeof record.severity === "number" ? record.severity : 0
      ),
      confidence: this.clamp01(
        typeof record.confidence === "number" ? record.confidence : 1
      ),
      timestamp:
        typeof record.timestamp === "number" && Number.isFinite(record.timestamp)
          ? record.timestamp
          : Date.now(),
    }
  }

  private createSignal(input: {
    source: ExecutionSignalSource
    entityId: string
    severity: number
    confidence: number
  }): ExecutionSignal {
    return {
      id: crypto.randomUUID(),
      source: input.source,
      entityId: input.entityId,
      severity: this.clamp01(input.severity),
      confidence: this.clamp01(input.confidence),
      timestamp: Date.now(),
    }
  }

  private mapDivergenceSeverity(severity: string): number {
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

  private isExecutionSignalSource(
    value: unknown
  ): value is ExecutionSignalSource {
    return (
      value === "COGNITION" ||
      value === "DRIFT" ||
      value === "RISK" ||
      value === "RECONCILIATION" ||
      value === "DIVERGENCE" ||
      value === "WALLET" ||
      value === "TREASURY" ||
      value === "ETK" ||
      value === "INTENT" ||
      value === "REPLAY" ||
      value === "FINALITY" ||
      value === "SIMULATION" ||
      value === "SYSTEM" ||
      value === "GOVERNANCE"
    )
  }

  private readString(value: unknown): string | null {
    return typeof value === "string" && value.length > 0 ? value : null
  }

  private clamp01(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(1, value))
  }
}

export const executionSignalAssembler = new ExecutionSignalAssembler()

export const SignalAssembler = executionSignalAssembler