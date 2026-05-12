import type { UnifiedOrganismState } from '@/engines/runtime/AXPTUnifiedOrganismFieldEngine'
import { organismSnapshotStore } from '@/engines/runtime/serverSingletons'

/**
 * 🔀 DETERMINISTIC FORK ENGINE
 * creates isolated simulation branches from frozen organism states
 */

export type ForkInput = {
  forkId: string
  baseSnapshotId: string

  overrides?: Partial<{
    drift: number
    intensity: number
    stability: number
    liquidity: number
    decisionPressure: number
    riskLevel: UnifiedOrganismState['riskLevel']
  }>
}

export type ForkedOrganismState = {
  forkId: string
  baseSnapshotId: string
  timestamp: number

  state: UnifiedOrganismState
  divergenceScore: number
}

export class AXPTDeterministicForkEngine {
  private forks: ForkedOrganismState[] = []

  /**
   * 🔀 CREATE FORK FROM SNAPSHOT
   */
  fork(input: ForkInput): ForkedOrganismState | null {
    const snapshot = organismSnapshotStore
      .getAll()
      .find(s =>
        s.id === input.baseSnapshotId ||
        String(s.tickIndex) === String(input.baseSnapshotId) ||
        String(s.timestamp) === String(input.baseSnapshotId)
      )

    if (!snapshot) return null

    const base = snapshot.state as UnifiedOrganismState

    const timestamp = Date.now()

    /**
     * 🧬 APPLY PURE OVERRIDES (NO SIDE EFFECTS)
     */
    const forkedState: UnifiedOrganismState = {
      ...base,

      drift: this.apply(base.drift, input.overrides?.drift),
      intensity: this.apply(base.intensity, input.overrides?.intensity),
      stability: this.apply(base.stability, input.overrides?.stability),
      liquidity: this.apply(base.liquidity, input.overrides?.liquidity),

      decisionPressure: this.apply(
        base.decisionPressure,
        input.overrides?.decisionPressure
      ),

      riskLevel: input.overrides?.riskLevel ?? base.riskLevel,

      timestamp, // fork-local time (detached from organism clock)
    }

    const fork: ForkedOrganismState = {
      forkId: input.forkId,
      baseSnapshotId: input.baseSnapshotId,
      timestamp,

      state: forkedState,

      divergenceScore: this.computeDivergence(base, forkedState),
    }

    this.forks.push(fork)

    return fork
  }

  getAll(): ForkedOrganismState[] {
    return [...this.forks]
  }

  getFork(forkId: string): ForkedOrganismState | ForkedOrganismState[] | null {
    if (forkId === "all") return this.getAll()
    return this.forks.find(fork => fork.forkId === forkId) ?? null
  }

  /**
   * 🧠 SAFE OVERRIDE APPLY
   */
  private apply(base: number, override?: number): number {
    if (override === undefined) return base
    return Math.max(0, Math.min(1, override))
  }

  /**
   * 📊 DIVERGENCE SCORING
   * measures how far fork deviates from reality
   */
  private computeDivergence(
    base: UnifiedOrganismState,
    fork: UnifiedOrganismState
  ): number {
    const deltas = [
      Math.abs(base.drift - fork.drift),
      Math.abs(base.intensity - fork.intensity),
      Math.abs(base.stability - fork.stability),
      Math.abs(base.liquidity - fork.liquidity),
      Math.abs(base.decisionPressure - fork.decisionPressure),
    ]

    return deltas.reduce((a, b) => a + b, 0) / deltas.length
  }
}

/**
 * 🧬 SINGLETON
 */
export const forkEngine = new AXPTDeterministicForkEngine()
