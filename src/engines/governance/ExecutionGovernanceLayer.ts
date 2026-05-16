import crypto from "crypto"

import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"

type Snapshot = Record<string, unknown>

type GovernanceDecision =
  | { allowed: true }
  | { allowed: false; reason: string }

type HumanOverride = {
  mode: "ALLOW_ALL" | "BLOCK_ALL"
  reason?: string
}

export class ExecutionGovernanceLayer {
  private killSwitch = false
  private humanOverride: HumanOverride | null = null

  activateKillSwitch(reason = "manual_trigger"): void {
    this.killSwitch = true
    console.warn("[GOVERNANCE] Kill switch activated:", reason)
  }

  deactivateKillSwitch(): void {
    this.killSwitch = false
    console.warn("[GOVERNANCE] Kill switch deactivated")
  }

  setHumanOverride(mode: HumanOverride["mode"], reason?: string): void {
    this.humanOverride = { mode, reason }
    console.warn("[GOVERNANCE] Human override set:", mode, reason)
  }

  clearHumanOverride(): void {
    this.humanOverride = null
  }

  /**
   * SAFETY DECISION
   *
   * This is a control-plane fallback only.
   * ETK remains the primary execution decision authority.
   */
  evaluate(snapshot: Snapshot): GovernanceDecision {
    if (this.humanOverride?.mode === "BLOCK_ALL") {
      return { allowed: false, reason: "HUMAN_OVERRIDE_BLOCK_ALL" }
    }

    if (this.killSwitch) {
      return { allowed: false, reason: "KILL_SWITCH_ACTIVE" }
    }

    if (this.isCriticalRisk(snapshot)) {
      return { allowed: false, reason: "CRITICAL_RISK_BLOCKED" }
    }

    return { allowed: true }
  }

  /**
   * ETK SIGNAL ADAPTER
   *
   * Emits canonical ExecutionSignal only:
   * id, source, entityId, severity, confidence, timestamp
   *
   * This does NOT emit decision, type, state, replayState, or payload.
   */
  evaluateSignal(snapshot: Snapshot): ExecutionSignal {
    const critical = this.isCriticalRisk(snapshot)

    return {
      id: crypto.randomUUID(),
      source: "GOVERNANCE",
      entityId: this.resolveEntityId(snapshot),
      severity: this.computeSeverity(critical),
      confidence: 1,
      timestamp: Date.now(),
    }
  }

  private isCriticalRisk(snapshot: Snapshot): boolean {
    const governance = this.readRecord(snapshot, "governance")

    return (
      snapshot.riskLevel === "CRITICAL" ||
      governance?.riskLevel === "CRITICAL"
    )
  }

  private computeSeverity(critical: boolean): number {
    if (this.humanOverride?.mode === "BLOCK_ALL") return 1
    if (this.killSwitch) return 1
    if (critical) return 1

    return 0
  }

  private resolveEntityId(snapshot: Snapshot): string {
    const direct =
      this.readString(snapshot, "entityId") ??
      this.readString(snapshot, "escrowId") ??
      this.readString(snapshot, "walletId") ??
      this.readString(snapshot, "userId")

    if (direct) return direct

    const payload = this.readRecord(snapshot, "payload")

    return (
      this.readString(payload, "entityId") ??
      this.readString(payload, "escrowId") ??
      "UNKNOWN_ENTITY"
    )
  }

  private readRecord(
    value: unknown,
    key: string
  ): Record<string, unknown> | null {
    if (!value || typeof value !== "object") return null

    const record = value as Record<string, unknown>
    const field = record[key]

    return field && typeof field === "object"
      ? (field as Record<string, unknown>)
      : null
  }

  private readString(value: unknown, key: string): string | null {
    if (!value || typeof value !== "object") return null

    const record = value as Record<string, unknown>
    const field = record[key]

    return typeof field === "string" && field.length > 0 ? field : null
  }
}

export const executionGovernance = new ExecutionGovernanceLayer()