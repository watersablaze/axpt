import crypto from "crypto"

import { executionRealityCompressionEngine } from "@/engines/reality/ExecutionRealityCompressionEngine"
import { etk } from "@/engines/execution/kernel/ExecutionTruthKernel"
import { executionMetaGovernance } from "@/engines/governance/ExecutionMetaGovernanceLayer"
import { authoritySpineCompiler } from "@/engines/operator/AuthoritySpineCompiler"
import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"

type OperatorIntent = {
  type?: string
  entityId?: string
  [key: string]: unknown
}

export class AXPTOperatorInterfaceLayer {
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
   * INTENT SUBMISSION
   *
   * Operator layer may submit an observation.
   * It does not execute.
   * It compiles the signal into spine, then ETK decides.
   */
  submitIntent(intent: OperatorIntent) {
    const entityId = intent.entityId ?? "UNKNOWN_ENTITY"

    const signalized: ExecutionSignal = {
      id: crypto.randomUUID(),
      source: "INTENT",
      entityId,
      severity: this.mapIntentSeverity(intent.type),
      confidence: 1,
      timestamp: Date.now(),
    }

    const spine = authoritySpineCompiler.build(
      [signalized],
      entityId,
      { intent }
    )

    const decision = etk.decide(spine)

    return {
      intent,
      decision,
    }
  }

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
    })

    return {
      metaGovernanceState: meta.state,
      actions: meta.actions,
      confidence: meta.confidence,
    }
  }

  private mapIntentSeverity(type?: string): number {
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