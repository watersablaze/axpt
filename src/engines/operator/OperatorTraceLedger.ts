import crypto from "crypto"

/**
 * 🧬 OPERATOR TRACE (IMMUTABLE EVENT RECORD)
 */
export type OperatorTrace = {
  id: string

  operatorId: string
  entityId: string

  intentType: string

  decisionOutcome: "COMMIT" | "REJECT" | "BLOCK"

  systemStabilityBefore: number
  systemStabilityAfter: number

  stabilityDelta: number

  divergenceImpact: number
  driftContribution: number

  timestamp: number
}

/**
 * 🧠 OPERATOR PROFILE (DERIVED STATE ONLY)
 */
export type OperatorProfile = {
  operatorId: string

  totalActions: number

  alignmentScore: number        // system stability improving behavior
  driftScore: number            // instability contribution
  reliabilityScore: number      // consistency of outcomes

  influenceWeight: number       // used by ETK (soft modifier)

  lastUpdated: number
}

/**
 * 🧬 OPERATOR TRACE LEDGER
 *
 * PURE OBSERVATION LAYER
 * - NO EXECUTION AUTHORITY
 * - NO GOVERNANCE AUTHORITY
 * - NO MUTATION OF SYSTEM STATE
 */
export class OperatorTraceLedger {
  private traces: OperatorTrace[] = []

  private profiles: Map<string, OperatorProfile> = new Map()

  /**
   * 🧾 APPEND TRACE (IMMUTABLE)
   */
  append(trace: OperatorTrace) {
    this.traces.push(trace)

    this.updateProfile(trace)
  }

  /**
   * 📊 GET ALL TRACES
   */
  getAll(operatorId?: string) {
    if (!operatorId) return [...this.traces]

    return this.traces.filter(t => t.operatorId === operatorId)
  }

  /**
   * 🧠 GET PROFILE
   */
  getProfile(operatorId: string): OperatorProfile {
    return (
      this.profiles.get(operatorId) ?? {
        operatorId,
        totalActions: 0,
        alignmentScore: 0,
        driftScore: 0,
        reliabilityScore: 0.5,
        influenceWeight: 0.5,
        lastUpdated: Date.now(),
      }
    )
  }

  /**
   * 🧬 PROFILE EVOLUTION
   */
  private updateProfile(trace: OperatorTrace) {
    const current = this.getProfile(trace.operatorId)

    const updated: OperatorProfile = {
      operatorId: trace.operatorId,

      totalActions: current.totalActions + 1,

      // alignment increases when system improves after action
      alignmentScore:
        this.blend(
          current.alignmentScore,
          trace.stabilityDelta > 0 ? 1 : 0,
          0.1
        ),

      // drift increases when instability is introduced
      driftScore:
        this.blend(
          current.driftScore,
          trace.driftContribution,
          0.1
        ),

      // reliability = low variance in outcomes
      reliabilityScore:
        this.blend(
          current.reliabilityScore,
          trace.decisionOutcome === "COMMIT" ? 1 : 0.3,
          0.05
        ),

      // influence is derived (bounded)
      influenceWeight: this.computeInfluence(
        current,
        trace
      ),

      lastUpdated: Date.now(),
    }

    this.profiles.set(trace.operatorId, updated)
  }

  /**
   * ⚖️ INFLUENCE MODEL
   *
   * NOTE:
   * This does NOT grant authority.
   * It only biases ETK weighting slightly.
   */
  private computeInfluence(
    profile: OperatorProfile,
    trace: OperatorTrace
  ) {
    const alignment = profile.alignmentScore
    const drift = profile.driftScore

    let weight = 0.5

    weight += alignment * 0.3
    weight -= drift * 0.4

    // clamp
    return Math.max(0.05, Math.min(1, weight))
  }

  /**
   * 🧮 SMOOTHING FUNCTION
   */
  private blend(current: number, incoming: number, alpha: number) {
    return current * (1 - alpha) + incoming * alpha
  }

  /**
   * 📈 SYSTEM ANALYTICS
   */
  getSystemSummary() {
    const all = [...this.profiles.values()]

    return {
      operatorCount: all.length,

      avgAlignment:
        all.reduce((a, b) => a + b.alignmentScore, 0) / (all.length || 1),

      avgDrift:
        all.reduce((a, b) => a + b.driftScore, 0) / (all.length || 1),

      avgInfluence:
        all.reduce((a, b) => a + b.influenceWeight, 0) / (all.length || 1),
    }
  }
}

/**
 * 🌐 SINGLETON
 */
export const operatorTraceLedger = new OperatorTraceLedger()