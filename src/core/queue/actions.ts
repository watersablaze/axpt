// src/core/queue/actions.ts

export function getAvailableActions(item: any): string[] {
  const actions: string[] = []

 {
    actions.push("LOCK_ESCROW")
    actions.push("RELEASE_ESCROW")
    actions.push("FLAG_REVIEW")
  }

  return actions
}