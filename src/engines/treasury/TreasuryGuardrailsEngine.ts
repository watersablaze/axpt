import type { ExecutionIntent } from "@/engines/core/types/ExecutionIntent"

/**
 * 🛡️ TREASURY SAFETY LAYER
 */
export class TreasuryGuardrailsEngine {

  /**
   * 🚨 VALIDATION ENTRY
   */
  validate(intent: ExecutionIntent): {
    allowed: boolean
    reason?: string
  } {

    // 1. ZERO CHECK
    if (intent.amountBaseUnits <= 0n) {
      return { allowed: false, reason: "INVALID_AMOUNT" }
    }

    // 2. LARGE VALUE LIMIT (example threshold)
    if (intent.amountBaseUnits > 1_000_000n) {
      return { allowed: false, reason: "EXCESSIVE_AMOUNT" }
    }

    // 3. SELF TRANSFER CHECK
    if (intent.fromUserId === intent.toUserId) {
      return { allowed: false, reason: "SELF_TRANSFER_BLOCKED" }
    }

    // 4. ASSET VALIDATION
    if (!intent.assetCode) {
      return { allowed: false, reason: "MISSING_ASSET" }
    }

    return { allowed: true }
  }
}

/**
 * 🧬 SINGLETON
 */
export const treasuryGuardrails = new TreasuryGuardrailsEngine()