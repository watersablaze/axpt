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

export class ReconciliationEngine {

  constructor(
    private memory = new MemoryGraphEngine(),
    private replayEngine = new LedgerReplayEngine()
  ) {}

  async reconcile(caseId: string) {
    const core = await this.computeCore(caseId)
    const { driftScore, anomalies, isConsistent } = core
    const enforcementSignal = this.computeEnforcementSignal(driftScore)

    // ─────────────────────────────
    // OBSERVATION OUTPUT ONLY
    // ─────────────────────────────

    return {
      isConsistent,
      driftScore,
      anomalies,
      enforcementSignal,
    }
  }

  async reconcileSignal(caseId: string): Promise<ExecutionSignal> {
    const core = await this.computeCore(caseId)
    const { driftScore, anomalies, isConsistent } = core
    const enforcementSignal = this.computeEnforcementSignal(driftScore)

    return {
      source: "RECONCILIATION",
      type: isConsistent ? "CONSISTENT" : "DRIFT",
      severity: Math.min(1, driftScore),
      confidence: anomalies.length ? 0.75 : 1,
      timestamp: Date.now(),
      payload: {
        isConsistent,
        driftScore,
        anomalies,
        enforcementSignal,
      },
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

  private computeDrift(a: any, b: any) {
    const aEvents = Array.isArray(a?.events) ? a.events : []
    const bEvents = Array.isArray(b?.events) ? b.events : []
    const aTransfers = Array.isArray(a?.transfers) ? a.transfers : []
    const bTransfers = Array.isArray(b?.transfers) ? b.transfers : []

    const eventMismatch = Math.abs(aEvents.length - bEvents.length)
    const transferMismatch = aTransfers.length !== bTransfers.length ? 1 : 0

    return Math.min(
      1,
      (eventMismatch * 0.01) +
        (transferMismatch * 0.4)
    )
  }

  private detectAnomalies(a: any, b: any) {
    const anomalies = []
    const aTransfers = Array.isArray(a?.transfers) ? a.transfers : []
    const bTransfers = Array.isArray(b?.transfers) ? b.transfers : []

    if (aTransfers.length !== bTransfers.length) anomalies.push("TRANSFER_MISMATCH")
    return anomalies
  }

  private computeEnforcementSignal(
    driftScore: number
  ): "DRIFT_RISK" | "STABLE" {
    return driftScore > 0.1 ? "DRIFT_RISK" : "STABLE"
  }
}
