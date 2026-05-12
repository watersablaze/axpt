import { unifiedOrganismFieldEngine } from "@/engines/runtime/AXPTUnifiedOrganismFieldEngine"
import { executionIntentQueue } from "@/engines/execution/queue/AXPTExecutionIntentQueue"
import { reconciliationEngine, ledgerReplayEngine } from "@/engines/runtime/serverSingletons"
import { governorEngine } from "@/engines/governance/AXPTGovernorEngine"

/**
 * 🧠 AXPT COGNITIVE FEEDBACK ENGINE
 * System self-adjustment layer
 */
export class AXPTCognitiveFeedbackEngine {

  /**
   * 🔁 MAIN FEEDBACK LOOP
   */
  async process(caseId?: string) {

    /**
     * 1. GET ORGANISM STATE
     */
    const organism = unifiedOrganismFieldEngine.getState()

    /**
     * 2. GET RECONCILIATION STATE
     */
    const recon = await reconciliationEngine.reconcile(caseId ?? "global")

    /**
     * 3. GET LEDGER TRUTH
     */
    const ledger = await ledgerReplayEngine.replay(caseId)

    /**
     * 4. COMPUTE COGNITIVE DELTA
     */
    const delta = this.computeDelta({
      organism,
      recon,
      ledger,
    })

    /**
     * 5. APPLY SYSTEM FEEDBACK
     */
    this.applyFeedback(delta)

    /**
     * 6. RETURN FEEDBACK TRACE
     */
    return {
      delta,
      organismState: organism.phase,
      drift: recon.driftScore,
    }
  }

  /**
   * 🧠 DELTA COMPUTATION (SYSTEM SELF-AWARENESS)
   */
  private computeDelta(input: any) {
    const drift = input.recon.driftScore ?? 0
    const liquidity = input.organism.liquidity ?? 0
    const instability = input.organism.decisionPressure ?? 0

    return {
      driftSignal: drift,
      liquidityBias: liquidity - 0.5,
      instabilitySignal: instability,

      /**
       * core idea:
       * system reacts stronger when all 3 align negatively
       */
      pressureIndex:
        drift * 0.5 +
        instability * 0.3 +
        (1 - liquidity) * 0.2,
    }
  }

  /**
   * 🧠 APPLY FEEDBACK INTO SYSTEM BEHAVIOR
   */
  private applyFeedback(delta: any) {

    /**
     * 1. GOVERNOR ADAPTATION HOOK
     */
    if (delta.pressureIndex > 0.75) {
      // tighten system temporarily
      ;(governorEngine as any).overrideBias = "STRICT"
    }

    if (delta.pressureIndex < 0.3) {
      // relax system constraints
      ;(governorEngine as any).overrideBias = "RELAXED"
    }

    /**
     * 2. QUEUE REWEIGHTING (future deterministic scheduler hook)
     */
    if (delta.driftSignal > 0.6) {
      ;(executionIntentQueue as any).priorityMode = "RISK_FIRST"
    }

    /**
     * 3. ORGANISM FIELD TUNING SIGNAL
     */
    unifiedOrganismFieldEngine["lastCognitiveDelta"] = delta
  }
}

/**
 * 🧬 SINGLETON
 */
export const cognitiveFeedbackEngine =
  new AXPTCognitiveFeedbackEngine()
