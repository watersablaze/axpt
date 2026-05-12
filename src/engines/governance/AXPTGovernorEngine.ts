import type { ExecutionIntent } from "@/engines/core/types/ExecutionIntent"
import { unifiedOrganismFieldEngine } from "@/engines/runtime/clientSingletons"

export type GovernorState = {
  paused: boolean
  escrowOnly: boolean
  maxTransferBaseUnits: bigint
  riskCeiling: number
  organismRiskOverride: number
  circuitTriggered: boolean
}

export class AXPTGovernorEngine {

  private state: GovernorState = {
    paused: false,
    escrowOnly: false,
    maxTransferBaseUnits: BigInt(1_000_000),
    riskCeiling: 0.85,
    organismRiskOverride: 1,
    circuitTriggered: false,
  }

  /**
   * 🧠 MAIN GUARD FUNCTION (CALLED BEFORE EXECUTION)
   */
  evaluate(intent: ExecutionIntent): {
    allowed: boolean
    reason?: string
    modeOverride?: ExecutionIntent['suggestedMode']
  } {

    const organism = unifiedOrganismFieldEngine.getState()

    const risk = Math.max(
      intent.riskHint ?? 0,
      intent.twinRiskScore ?? 0
    )

    // ──────────────────────────────
    // 1. CIRCUIT BREAKER
    // ──────────────────────────────
    if (this.state.paused || this.state.circuitTriggered) {
      return {
        allowed: false,
        reason: "SYSTEM_PAUSED_OR_CIRCUIT_TRIGGERED",
      }
    }

    // ──────────────────────────────
    // 2. ESCROW ONLY MODE
    // ──────────────────────────────
    if (this.state.escrowOnly) {
      return {
        allowed: true,
        modeOverride: "ESCROW",
        reason: "ESCROW_ONLY_MODE_ACTIVE",
      }
    }

    // ──────────────────────────────
    // 3. RISK CEILING CHECK
    // ──────────────────────────────
    if (risk > this.state.riskCeiling) {
      return {
        allowed: false,
        reason: "RISK_CEILING_EXCEEDED",
      }
    }

    // ──────────────────────────────
    // 4. ORGANISM PRESSURE CHECK
    // ──────────────────────────────
    if (organism.decisionPressure > 0.9) {
      return {
        allowed: true,
        modeOverride: "ESCROW",
        reason: "HIGH_SYSTEM_PRESSURE_FORCED_ESCROW",
      }
    }

    // ──────────────────────────────
    // 5. MAX TRANSFER LIMIT
    // ──────────────────────────────
    if (intent.amountBaseUnits > this.state.maxTransferBaseUnits) {
      return {
        allowed: false,
        reason: "MAX_TRANSFER_LIMIT_EXCEEDED",
      }
    }

    // ──────────────────────────────
    // DEFAULT PASS THROUGH
    // ──────────────────────────────
    return { allowed: true }
  }

  /**
   * ⚙️ CONTROL SURFACE (FROM UI)
   */
  updateState(partial: Partial<GovernorState>) {
    this.state = {
      ...this.state,
      ...partial,
    }
  }

  /**
   * 🔒 EMERGENCY CIRCUIT TRIGGER
   */
  triggerCircuit(reason: string) {
    this.state.circuitTriggered = true
    console.warn("[GOVERNOR CIRCUIT TRIGGERED]", reason)
  }

  /**
   * 🔓 RESET CIRCUIT
   */
  resetCircuit() {
    this.state.circuitTriggered = false
  }

  getState() {
    return this.state
  }
}

/**
 * 🧬 SINGLETON
 */
export const governorEngine = new AXPTGovernorEngine()
