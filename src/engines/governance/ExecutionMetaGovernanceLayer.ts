export type MetaGovernanceInput = {
  stabilitySeries: Array<{ stabilityScore: number }>

  collectiveMemory: {
    globalRiskBias: number
    globalDriftBias: number
    globalGovernanceStrictness: number
  }

  transferActivity: Array<{ similarity: number }>

  evolutionWeights: {
    riskWeight: number
    driftWeight: number
    finalityWeight: number
  }
}

export type MetaGovernanceDecision = {
  state: "UNSAFE_ADAPTATION" | "OVERFITTING" | "DRIFTING" | "OVER_RESTRICTIVE" | "STABLE"
  actions: Record<string, boolean>
  confidence: number
}

export class ExecutionMetaGovernanceLayer {

  /**
   * 🧠 CORE EVALUATION
   */
  evaluate(input: MetaGovernanceInput): MetaGovernanceDecision {

    const instability = this.computeInstability(input.stabilitySeries)

    const biasDrift = this.computeBiasDrift(input.collectiveMemory)

    const transferEntropy = this.computeTransferEntropy(input.transferActivity)

    const evolutionAggression = this.computeEvolutionAggression(input.evolutionWeights)

    // ─────────────────────────────
    // 🧠 CLASSIFICATION
    // ─────────────────────────────

    if (instability > 0.8 && biasDrift > 0.7) {
      return {
        state: "UNSAFE_ADAPTATION",
        actions: {
          activateCircuitBreaker: true,
          resetCollectiveBias: true,
        },
        confidence: 1,
      }
    }

    if (evolutionAggression > 0.75) {
      return {
        state: "OVERFITTING",
        actions: {
          dampenEvolution: true,
          tightenETKThresholds: true,
        },
        confidence: 0.9,
      }
    }

    if (transferEntropy > 0.7) {
      return {
        state: "DRIFTING",
        actions: {
          reduceTransferSensitivity: true,
        },
        confidence: 0.85,
      }
    }

    if (biasDrift < 0.2 && instability < 0.3) {
      return {
        state: "OVER_RESTRICTIVE",
        actions: {
          dampenEvolution: false,
        },
        confidence: 0.7,
      }
    }

    return {
      state: "STABLE",
      actions: {},
      confidence: 0.95,
    }
  }

  // ─────────────────────────────
  // 🧠 INTERNAL METRICS
  // ─────────────────────────────

  private computeInstability(series: any[]) {
    if (!series?.length) return 0
    return series.slice(-10).reduce((a, b) => a + (1 - b.stabilityScore), 0) / 10
  }

  private computeBiasDrift(collective: any) {
    return (
      collective.globalRiskBias +
      collective.globalDriftBias +
      collective.globalGovernanceStrictness
    ) / 3
  }

  private computeTransferEntropy(transfers: any[]) {
    if (!transfers?.length) return 0
    return transfers.filter(t => t.similarity < 0.5).length / transfers.length
  }

  private computeEvolutionAggression(weights: any) {
    return (
      weights.riskWeight +
      weights.driftWeight +
      weights.finalityWeight
    ) / 3
  }
}

export const executionMetaGovernance =
  new ExecutionMetaGovernanceLayer()
