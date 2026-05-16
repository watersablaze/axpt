import type {
  ExecutionIntent,
  ExecutionMode,
} from '@/engines/core/types/ExecutionIntent'

import { unifiedOrganismFieldEngine } from '@/engines/runtime/AXPTUnifiedOrganismFieldEngine'
import { PredictiveRiskEngine } from '@/engines/risk/PredictiveRiskEngine'
import { AXPTDigitalTwinEngine } from '@/engines/twin/AXPTDigitalTwinEngine'

/**
 * 🧾 EXECUTION INTENT ENGINE
 * Deterministic bridge between cognition → execution
 */
export class AXPTExecutionIntentEngine {
  private riskEngine = new PredictiveRiskEngine()
  private twinEngine = new AXPTDigitalTwinEngine({} as any)

  /**
   * 🧠 CREATE EXECUTION INTENT (DETERMINISTIC CONTEXT SNAPSHOT)
   */
  async createIntent(input: {
    fromUserId: string
    toUserId: string
    assetCode: string
    amountBaseUnits: bigint
    metadata?: Record<string, any>
  }): Promise<ExecutionIntent> {

    /**
     * 🧠 ORGANISM SNAPSHOT (READ-ONLY CONTEXT)
     */
    const organism = unifiedOrganismFieldEngine.getState()

    /**
     * ⚠️ RISK ANALYSIS LAYERS
     */
    const risk = await this.riskEngine.evaluate({
      userId: input.fromUserId,
      amountBaseUnits: input.amountBaseUnits,
    })

    const twin = await this.twinEngine.analyze({
      userId: input.fromUserId,
      amountBaseUnits: input.amountBaseUnits,
      assetCode: input.assetCode,
    })

    /**
     * ⚖️ MODE RESOLUTION (DETERMINISTIC DECISION RULESET)
     */
    const mode = this.resolveMode({
      organismRisk: organism.riskLevel,
      riskScore: risk.score,
      twinScore: twin.riskScore,
    })

    /**
     * 🧾 FINAL INTENT OBJECT (IMMUTABLE CONTRACT)
     */
    const intent: ExecutionIntent = {
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      assetCode: input.assetCode,
      amountBaseUnits: input.amountBaseUnits,

      riskHint: risk.score,
      twinRiskScore: twin.riskScore,

      suggestedMode: mode,

      metadata: Object.freeze({
        organismPhase: organism.phase,
        decisionPressure: organism.decisionPressure,
        stability: organism.stability,
        liquidity: organism.liquidity,
        timestamp: Date.now(),
        ...input.metadata,
      }),
    }

    return Object.freeze(intent)
  }

  /**
   * ⚖️ STRICT MODE RESOLUTION
   * (this will later plug into Execution Seal)
   */
  private resolveMode(input: {
    organismRisk: string
    riskScore: number
    twinScore: number
  }): ExecutionMode {

    const composite = this.clamp(
      (input.riskScore + input.twinScore) / 2
    )

    if (input.organismRisk === 'CRITICAL') return 'QUARANTINE'
    if (composite > 0.85) return 'REJECT'
    if (composite > 0.6) return 'ESCROW'

    return 'TRANSFER'
  }

  /**
   * 🧠 SAFE NORMALIZATION
   */
  private clamp(v: number): number {
    if (Number.isNaN(v)) return 0
    return Math.max(0, Math.min(1, v))
  }
}