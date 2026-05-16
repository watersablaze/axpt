import crypto from "crypto"

import { MemoryGraphEngine } from "@/engines/memory/MemoryGraphEngine"
import { LedgerReplayEngine } from "@/engines/replay/LedgerReplayEngine"
import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"

type ReconciliationStatus = {
  isHealthy: boolean
  driftScore: number
  anomalies: string[]
  enforcementSignal: "DRIFT_RISK" | "STABLE"
}

export type ReconciliationReport = {
  ledger: ReconciliationStatus
  escrow: ReconciliationStatus
  doubleEntry: ReconciliationStatus
  reconstructedBalances: unknown[]
  timestamp: number
}

export type ReconciliationObservation = {
  isConsistent: boolean
  driftScore: number
  anomalies: string[]
  enforcementSignal: "DRIFT_RISK" | "STABLE"
}

export class ReconciliationEngine {
  constructor(
    private memory = new MemoryGraphEngine(),
    private replayEngine = new LedgerReplayEngine()
  ) {}

  async reconcile(caseId: string): Promise<ReconciliationObservation> {
    const core = await this.computeCore(caseId)
    const enforcementSignal = this.computeEnforcementSignal(core.driftScore)

    return {
      isConsistent: core.isConsistent,
      driftScore: core.driftScore,
      anomalies: core.anomalies,
      enforcementSignal,
    }
  }

  async reconcileSignal(caseId: string): Promise<ExecutionSignal> {
    const core = await this.computeCore(caseId)

    return {
      id: crypto.randomUUID(),
      source: "RECONCILIATION",
      entityId: caseId,
      severity: this.clamp01(core.driftScore),
      confidence: core.anomalies.length ? 0.75 : 1,
      timestamp: Date.now(),
    }
  }

  /**
   * Compatibility read model for older runtime surfaces.
   * Observation only: no circuit breakers, compensation, or mutation.
   */
  async runFullReconciliation(caseId = "SYSTEM"): Promise<ReconciliationReport> {
    const core = await this.computeCore(caseId)
    const enforcementSignal = this.computeEnforcementSignal(core.driftScore)

    const status: ReconciliationStatus = {
      isHealthy: core.isConsistent,
      driftScore: core.driftScore,
      anomalies: core.anomalies,
      enforcementSignal,
    }

    return {
      ledger: status,
      escrow: status,
      doubleEntry: status,
      reconstructedBalances: [],
      timestamp: Date.now(),
    }
  }

  /**
   * Compatibility replay accessor for healing code.
   * Observation only: delegates to the replay engine.
   */
  async runLedgerReplay(caseId = "SYSTEM") {
    return this.replayEngine.replay(caseId)
  }

  /**
   * Compatibility anomaly descriptor.
   * Observation only: returns a structured anomaly without persistence.
   */
  async flagAnomaly(input: Record<string, unknown>) {
    return {
      ...input,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }
  }

  private async computeCore(caseId: string) {
    const replayed = await this.replayEngine.replay(caseId)
    const memory = await this.memory.replay(caseId, Date.now())

    const driftScore = this.computeDrift(replayed, memory)
    const anomalies = this.detectAnomalies(replayed, memory)

    return {
      replayed,
      memory,
      driftScore,
      anomalies,
      isConsistent: driftScore < 0.05 && anomalies.length === 0,
    }
  }

  private computeDrift(a: unknown, b: unknown): number {
    const aRecord = this.asRecord(a)
    const bRecord = this.asRecord(b)

    const aEvents = this.readArray(aRecord, "events")
    const bEvents = this.readArray(bRecord, "events")
    const aTransfers = this.readArray(aRecord, "transfers")
    const bTransfers = this.readArray(bRecord, "transfers")

    const eventMismatch = Math.abs(aEvents.length - bEvents.length)
    const transferMismatch = aTransfers.length !== bTransfers.length ? 1 : 0

    return this.clamp01(eventMismatch * 0.01 + transferMismatch * 0.4)
  }

  private detectAnomalies(a: unknown, b: unknown): string[] {
    const aRecord = this.asRecord(a)
    const bRecord = this.asRecord(b)

    const aTransfers = this.readArray(aRecord, "transfers")
    const bTransfers = this.readArray(bRecord, "transfers")

    const anomalies: string[] = []

    if (aTransfers.length !== bTransfers.length) {
      anomalies.push("TRANSFER_MISMATCH")
    }

    return anomalies
  }

  private computeEnforcementSignal(
    driftScore: number
  ): "DRIFT_RISK" | "STABLE" {
    return driftScore > 0.1 ? "DRIFT_RISK" : "STABLE"
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {}
  }

  private readArray(
    record: Record<string, unknown>,
    key: string
  ): unknown[] {
    const value = record[key]
return Array.isArray(value) ? value : []
  }

  private clamp01(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(1, value))
  }
}

export const reconciliationEngine = new ReconciliationEngine()