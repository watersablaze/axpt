import type {
  ExecutionDecision,
  ExecutionSignal,
  ExecutionSignalSource,
} from "@/engines/contracts/ExecutionContracts"

export type {
  ExecutionDecision,
  ExecutionSignal,
  ExecutionSignalSource,
} from "@/engines/contracts/ExecutionContracts"

type ExecutionSignalBundle = Partial<
  Record<Lowercase<ExecutionSignalSource>, ExecutionSignal>
>

export class ExecutionTruthKernel {

  /**
   * Pure reducer: signals in, decision out.
   */
  decide(rawSignals: ExecutionSignal[], entityId = "global"): ExecutionDecision {
    const validated = this.filterSignals(rawSignals)
    const bundle = this.buildBundle(validated)

    const divergenceSeverity = bundle.divergence?.severity ?? 0
    const riskSeverity = bundle.risk?.severity ?? 0
    const reconciliationSeverity = bundle.reconciliation?.severity ?? 0
    const governanceSeverity = bundle.governance?.severity ?? 0
    const driftSeverity = bundle.drift?.severity ?? 0
    const finalitySeverity = bundle.finality?.severity ?? 0
    const collapseRisk = this.resolveCollapseRisk(bundle)

    if (divergenceSeverity >= 1) {
      return this.block("CRITICAL_STATE_DIVERGENCE")
    }

    if (riskSeverity > 0.85) {
      return this.block("RISK_THRESHOLD_EXCEEDED")
    }

    if (this.isGovernanceRejection(bundle.governance)) {
      return {
        status: "REJECT",
        reason: "GOVERNANCE_POLICY_REJECTION",
      }
    }

    if (reconciliationSeverity > 0.9) {
      return this.block("RECONCILIATION_DRIFT_CRITICAL")
    }

    if (collapseRisk > 0.85) {
      return this.block("COLLAPSE_PREDICTION_CRITICAL")
    }

    const finalityScore = this.clamp(1 - finalitySeverity)
    const stabilityScore = this.clamp(
      finalityScore * (1 - collapseRisk) - driftSeverity * 0.25
    )
    const cognitiveConfidence = this.resolveCognitiveConfidence(bundle)

    if (stabilityScore < 0.4) {
      return this.block("TEMPORAL_UNSTABLE_STATE")
    }

    if (stabilityScore < 0.65) {
      return {
        status: "REJECT",
        reason: "TEMPORAL_LOW_CONFIDENCE",
      }
    }

    return {
      status: "COMMIT",
      executionPlan: {
        replayState: this.resolveReplayState(bundle.replay),
        governanceApproved: governanceSeverity < 1,
        riskLevel: riskSeverity,
        finalityScore,
        cognitiveConfidence,
        collapseRisk,
        stabilityScore,
      },
    }
  }

  private filterSignals(signals: ExecutionSignal[]) {
    return signals
      .filter(signal => Boolean(signal?.source && signal?.type))
      .map(signal => ({
        ...signal,
        severity: this.clamp(signal.severity),
        confidence: this.clamp(signal.confidence),
        timestamp: signal.timestamp ?? Date.now(),
      }))
  }

  private buildBundle(signals: ExecutionSignal[]): ExecutionSignalBundle {
    return signals.reduce<ExecutionSignalBundle>((bundle, signal) => {
      const key = signal.source.toLowerCase() as Lowercase<ExecutionSignalSource>

      if (!bundle[key]) {
        bundle[key] = signal
        return bundle
      }

      if (signal.severity > bundle[key]!.severity) {
        bundle[key] = signal
      }

      return bundle
    }, {})
  }

  private isGovernanceRejection(signal?: ExecutionSignal) {
    if (!signal) return false

    const payload = signal.payload as { decision?: string; type?: string } | null

    return (
      signal.severity >= 1 ||
      signal.type === "REJECTED" ||
      payload?.decision === "REJECT"
    )
  }

  private resolveReplayState(signal?: ExecutionSignal) {
    const payload = signal?.payload as { finalState?: string } | null
    return signal?.replayState ?? signal?.state ?? payload?.finalState ?? null
  }

  private resolveCollapseRisk(bundle: ExecutionSignalBundle) {
    const collapseSignal =
      bundle.simulation?.type === "COLLAPSE_PREDICTION"
        ? bundle.simulation
        : undefined

    const payload = collapseSignal?.payload as { collapseRisk?: number } | null

    return this.clamp(payload?.collapseRisk ?? collapseSignal?.severity ?? 0)
  }

  private resolveCognitiveConfidence(bundle: ExecutionSignalBundle) {
    return bundle.cognition?.confidence ?? bundle.system?.confidence ?? 0.5
  }

  private block(reason: string): ExecutionDecision {
    return {
      status: "BLOCK",
      reason,
    }
  }

  private clamp(value: number) {
    return Math.max(0, Math.min(1, value))
  }
}

export const etk = new ExecutionTruthKernel()
