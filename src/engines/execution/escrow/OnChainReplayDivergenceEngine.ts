import type { EscrowStatus } from "@/domains/escrow/escrowStatus"
import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"

type DivergenceStatus =
  | "MATCH"
  | "DRIFT"
  | "CONFLICT"
  | "MISSING_ONCHAIN"

type DivergenceSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export type DivergenceReport = {
  escrowId: string
  status: DivergenceStatus
  replayState: EscrowStatus | null
  chainState: EscrowStatus | null
  driftSignals: string[]
  severity: DivergenceSeverity
}

export class OnchainReplayDivergenceEngine {
  compare(params: {
    escrowId: string
    replayState: EscrowStatus | null
    chainState: EscrowStatus | null
  }): DivergenceReport {

    const driftSignals: string[] = []

    const { escrowId, replayState, chainState } = params

    // 1. Missing onchain data
    if (!chainState) {
      return {
        escrowId,
        status: "MISSING_ONCHAIN",
        replayState,
        chainState: null,
        driftSignals: ["NO_CHAIN_STATE_FOUND"],
        severity: "HIGH",
      }
    }

    // 2. Direct match
    if (replayState === chainState) {
      return {
        escrowId,
        status: "MATCH",
        replayState,
        chainState,
        driftSignals: [],
        severity: "LOW",
      }
    }

    // 3. Structural drift
    if (this.isInvalidProgression(replayState, chainState)) {
      driftSignals.push("INVALID_STATE_TRANSITION")
    }

    // 4. Temporal mismatch heuristic (future extension hook)
    if (this.isLikelyDelayedFinalization(replayState, chainState)) {
      driftSignals.push("FINALIZATION_DELAY_DRIFT")
    }

    const severity = this.computeSeverity(driftSignals)

    return {
      escrowId,
      status: driftSignals.length ? "DRIFT" : "CONFLICT",
      replayState,
      chainState,
      driftSignals,
      severity,
    }
  }

  compareSignal(params: {
    escrowId: string
    replay: ExecutionSignal
    chainState?: EscrowStatus | null
  }): ExecutionSignal {
    const divergence = this.compare({
      escrowId: params.escrowId,
      replayState: params.replay.state as EscrowStatus | null,
      chainState: params.chainState ?? null,
    })

    return {
      source: "DIVERGENCE",
      type: divergence.status,
      severity: this.mapSeverity(divergence.severity),
      confidence: 1,
      timestamp: Date.now(),
      payload: divergence,
    }
  }

  private isInvalidProgression(replay: EscrowStatus | null, chain: EscrowStatus | null) {
    if (!replay || !chain) return false

    const invalidPairs = new Set([
      "ACTIVE->INITIATED",
      "RELEASED->ACTIVE",
      "SETTLED->ACTIVE",
      "CANCELLED->RELEASED",
    ])

    return invalidPairs.has(`${chain}->${replay}`)
  }

  private isLikelyDelayedFinalization(replay: EscrowStatus | null, chain: EscrowStatus | null) {
    return replay === "RELEASED" && chain === "FUNDS_LOCKED"
  }

  private computeSeverity(signals: string[]): DivergenceSeverity {
    if (signals.includes("INVALID_STATE_TRANSITION")) return "CRITICAL"
    if (signals.includes("FINALIZATION_DELAY_DRIFT")) return "HIGH"
    if (signals.length > 0) return "MEDIUM"
    return "LOW"
  }

  private mapSeverity(severity: DivergenceSeverity) {
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
}
