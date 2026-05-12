import { executionTraceLedger } from "@/engines/trace/ExecutionTraceLedger"
import type { ExecutionSignal } from "@/engines/contracts/ExecutionContracts"

type Snapshot = any

type GovernanceDecision =
  | { allowed: true }
  | { allowed: false; reason: string }

export class ExecutionGovernanceLayer {
  private killSwitch = false
  private humanOverride: null | {
    mode: "ALLOW_ALL" | "BLOCK_ALL"
    reason?: string
  } = null

  // ─────────────────────────────
  // 🚨 CONTROL PLANE (NOT ETK)
  // ─────────────────────────────

  activateKillSwitch(reason = "manual_trigger") {
    this.killSwitch = true
    console.warn("[GOVERNANCE] Kill switch activated:", reason)
  }

  deactivateKillSwitch() {
    this.killSwitch = false
    console.warn("[GOVERNANCE] Kill switch deactivated")
  }

  setHumanOverride(mode: "ALLOW_ALL" | "BLOCK_ALL", reason?: string) {
    this.humanOverride = { mode, reason }
    console.warn("[GOVERNANCE] Human override set:", mode, reason)
  }

  clearHumanOverride() {
    this.humanOverride = null
  }

  // ─────────────────────────────
  // 🧭 SAFETY DECISION (ETK Fallback ONLY)
  // ─────────────────────────────

  evaluate(snapshot: Snapshot): GovernanceDecision {
    if (this.humanOverride?.mode === "BLOCK_ALL") {
      return { allowed: false, reason: "HUMAN_OVERRIDE_BLOCK_ALL" }
    }

    if (this.killSwitch) {
      return { allowed: false, reason: "KILL_SWITCH_ACTIVE" }
    }

    if ((snapshot?.riskLevel ?? snapshot?.governance?.riskLevel) === "CRITICAL") {
      return { allowed: false, reason: "CRITICAL_RISK_BLOCKED" }
    }

    return { allowed: true }
  }

  // ─────────────────────────────
  // 🧠 ETK SIGNAL ADAPTER (PURE)
  // ─────────────────────────────

  evaluateSignal(snapshot: Snapshot): ExecutionSignal {
    const critical =
      (snapshot?.riskLevel ?? snapshot?.governance?.riskLevel) === "CRITICAL"

    return {
      source: "GOVERNANCE",
      type: this.computePolicyType(snapshot, critical),
      severity: this.computeSeverity(snapshot, critical),
      confidence: 1,
      timestamp: Date.now(),
      decision: this.killSwitch || critical ? "REJECT" : "ALLOW",
      payload: snapshot,
    }
  }

  // ─────────────────────────────
  // 🧠 INTERNAL SIGNAL FEATURES (NO AUTHORITY)
  // ─────────────────────────────

  private computePolicyType(snapshot: Snapshot, critical: boolean): string {
    if (this.killSwitch) return "KILL_SWITCH_ACTIVE"
    if (critical) return "CRITICAL_RISK"
    return "POLICY_STABLE"
  }

  private computeSeverity(snapshot: Snapshot, critical: boolean): number {
    if (this.killSwitch) return 1
    if (critical) return 1
    return 0
  }
}

export const executionGovernance = new ExecutionGovernanceLayer()