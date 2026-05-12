import type { EscrowStatus } from "@/domains/escrow/escrowStatus"

/**
 * 🔐 PURE DETERMINISTIC STATE MACHINE
 * (NO SIDE EFFECTS — ONLY RULES)
 */

export class EscrowStateMachine {
  private transitions: Record<EscrowStatus, EscrowStatus[]> = {
    INITIATED: ["ACTIVE", "CANCELLED"],

    ACTIVE: ["FUNDS_LOCKED", "DISPUTED", "CANCELLED"],

    FUNDS_LOCKED: ["DISPUTED", "RELEASED", "CANCELLED"],

    DISPUTED: ["ARBITRATED", "CANCELLED"],

    ARBITRATED: ["RELEASED", "CANCELLED"],

    RELEASED: ["SETTLED"],

    SETTLED: [],

    CANCELLED: [],
  }

  /**
   * ✅ RULE CHECK: Can we transition?
   */
  canTransition(from: EscrowStatus, to: EscrowStatus): boolean {
    return this.transitions[from]?.includes(to) ?? false
  }

  /**
   * 🔒 HARD VALIDATION (strict mode for replay engine)
   */
  assertTransition(from: EscrowStatus, to: EscrowStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `[ESCROW STATE VIOLATION] Invalid transition: ${from} → ${to}`
      )
    }
  }

  /**
   * 🧭 NEXT STATE (pure helper)
   */
  getNextStates(from: EscrowStatus): EscrowStatus[] {
    return this.transitions[from] ?? []
  }
}