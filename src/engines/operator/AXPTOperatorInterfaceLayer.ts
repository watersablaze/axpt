import { executionRealityCompressionEngine } from "@/engines/reality/ExecutionRealityCompressionEngine"
import { etk } from "@/engines/execution/kernel/ExecutionTruthKernel"
import { executionMetaGovernance } from "@/engines/governance/ExecutionMetaGovernanceLayer"
import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"

export class AXPTOperatorInterfaceLayer {

  /**
   * 🧭 OBSERVATION API
   */
  observe(entityId: string) {
    const compressed =
      executionRealityCompressionEngine.getArchetype(entityId)

    const delta =
      executionRealityCompressionEngine.getDelta(entityId)

    return {
      entityId,
      archetype: compressed?.dominantBehavior ?? "UNKNOWN",
      stability: compressed?.stabilityProfile ?? 1,
      drift: compressed?.driftProfile ?? 0,
      risk: compressed?.riskProfile ?? 0,
      finality: compressed?.confidence ?? 1,
      delta,
    }
  }

  /**
   * 🧠 INTENT SUBMISSION (NON-EXECUTING)
   */
  submitIntent(intent: any) {

    const signalized: ExecutionSignal = {
      source: "INTENT",
      type: intent.type,
      severity: this.mapIntentSeverity(intent.type),
      confidence: 1,
      timestamp: Date.now(),
      payload: intent,
      entityId: intent.entityId,
    }

    const decision = etk.decide(
      [signalized],
      intent.entityId
    )

    return {
      intent,
      decision,
    }
  }

  /**
   * ⚖️ SYSTEM HEALTH VIEW
   */
  systemView() {
    const meta = executionMetaGovernance.evaluate({
      collectiveMemory: {
        globalRiskBias: 0,
        globalDriftBias: 0,
        globalGovernanceStrictness: 0,
      },
      evolutionWeights: {
        riskWeight: 0,
        driftWeight: 0,
        finalityWeight: 0,
      },
      transferActivity: [],
      stabilitySeries: [],
      decisionHistory: [],
    })

    return {
      metaGovernanceState: meta.state,
      actions: meta.actions,
      confidence: meta.confidence,
    }
  }

  /**
   * 🧠 INTENT NORMALIZATION
   */
  private mapIntentSeverity(type: string): number {
    switch (type) {
      case "REQUEST_FINALIZE":
        return 0.8
      case "REQUEST_REFUND":
        return 0.6
      case "REQUEST_REBALANCE":
        return 0.5
      default:
        return 0.3
    }
  }
}

export const axptOperatorInterface =
  new AXPTOperatorInterfaceLayer()