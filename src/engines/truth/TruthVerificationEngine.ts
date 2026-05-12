// src/engines/truth/TruthVerificationEngine.ts

import { EscrowReplayEngine } from "@/engines/execution/escrow/EscrowReplayEngine"

export type ChainState =
  | "UNKNOWN"
  | "PENDING"
  | "FUNDS_LOCKED"
  | "SETTLED"

export type TruthReport = {
  escrowId: string

  replay: {
    finalState: string | null
    validity: "VALID" | "INVALID" | "PARTIAL"
    invalidTransitions: string[]
  }

  chain: {
    state: ChainState
    txHash?: string
    blockNumber?: number
    consistency: "MATCH" | "MISMATCH" | "UNKNOWN"
  }

  divergence: {
    severity: 0 | 0.25 | 0.5 | 0.75 | 1
    type: "NONE" | "CRITICAL"
  }

  coherence: {
    replayConfidence: number
    chainConfidence: number
    alignmentScore: number
  }

  timestamp: number
}

type ChainAdapter = {
  getState: (escrowId: string) => Promise<{
    state: ChainState
    txHash?: string
    blockNumber?: number
  }>
}

export class TruthVerificationEngine {
  constructor(
    private replayEngine: EscrowReplayEngine,
    private chainAdapter: ChainAdapter
  ) {}

  /**
   * 🧠 SINGLE ENTRY POINT
   */
  async verify(escrowId: string, events: any[]): Promise<TruthReport> {
    const replay = this.buildReplay(events)

    const chain = await this.chainAdapter.getState(escrowId)

    const divergence = this.computeDivergence(replay, chain)

    const coherence = this.computeCoherence(replay, chain)

    return {
      escrowId,
      replay,
      chain: {
        ...chain,
        consistency: this.computeConsistency(replay.finalState, chain.state),
      },
      divergence,
      coherence,
      timestamp: Date.now(),
    }
  }

  // ─────────────────────────────
  // 🧠 REPLAY SYNTHESIS
  // ─────────────────────────────

  private buildReplay(events: any[]) {
    if (!events || events.length === 0) {
      return {
        finalState: null,
        validity: "INVALID" as const,
        invalidTransitions: [],
      }
    }

    const result = this.replayEngine.replay(events)

    return {
      finalState: result.finalState ?? null,
      validity:
        result.invalidTransitions.length > 0
          ? ("PARTIAL" as const)
          : ("VALID" as const),
      invalidTransitions: result.invalidTransitions ?? [],
    }
  }

  // ─────────────────────────────
  // ⛓ CHAIN ALIGNMENT
  // ─────────────────────────────

  private computeConsistency(
    replayState: string | null,
    chainState: string
  ): "MATCH" | "MISMATCH" | "UNKNOWN" {
    if (!replayState || !chainState) return "UNKNOWN"
    return replayState === chainState ? "MATCH" : "MISMATCH"
  }

  // ─────────────────────────────
  // ⚖️ DIVIATION MODEL (NO DECISIONS)
  // ─────────────────────────────

  private computeDivergence(replay: any, chain: any): TruthReport["divergence"] {
    if (!chain?.state) {
      return {
        severity: 0.5,
        type: "CRITICAL",
      }
    }

    const match = replay.finalState === chain.state

    if (match) {
      return {
        severity: 0,
        type: "NONE",
      }
    }

    return {
      severity: 0.75,
      type: "CRITICAL",
    }
  }

  // ─────────────────────────────
  // 🧠 COHERENCE MODEL
  // ─────────────────────────────

  private computeCoherence(replay: any, chain: any) {
    const replayConfidence =
      replay.validity === "VALID" ? 1 : 0.6

    const chainConfidence =
      chain.state === "SETTLED" ? 1 : 0.7

    return {
      replayConfidence,
      chainConfidence,
      alignmentScore: (replayConfidence + chainConfidence) / 2,
    }
  }
}
