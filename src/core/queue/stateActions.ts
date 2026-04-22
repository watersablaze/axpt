import type { CaseState } from "./state"

export function getActionsFromState(state: CaseState): string[] {
  const actions: string[] = []

  if (
    state.gates.total > 0 &&
    state.gates.pending === 0 &&
    state.escrowStatus !== "LOCKED"
  ) {
    actions.push("LOCK_ESCROW")
  }

  if (state.gates.signaturePending > 0) {
    actions.push("COLLECT_SIGNATURE")
  }

  if (state.artifacts.submitted < state.artifacts.required) {
    actions.push("REQUEST_ARTIFACT")
  }

  if (
    state.escrowStatus === "LOCKED" &&
    state.caseStatus === "COMPLETED"
  ) {
    actions.push("RELEASE_ESCROW")
  }

  // 🔥 CRITICAL SAFETY NET
  if (actions.length === 0) {
    actions.push("FLAG_REVIEW")
  }

  return actions
}