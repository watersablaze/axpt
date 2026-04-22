import { IntentType, IntentContext } from './intentTypes'
import { readSystemState } from './systemState'

export type PlannedAction = {
  type: string
  payload?: any
  // optional condition evaluated at execution time
  condition?: (state: SystemSnapshot) => boolean
  // optional priority/order hint (lower runs first)
  order?: number
}

export type SystemSnapshot = {
  hasChainData: boolean
  isSynced: boolean
  hasMismatches: boolean
  hasDeadLetters: boolean
}

export async function planIntent(
  intent: IntentType,
  ctx: IntentContext
): Promise<PlannedAction[]> {
  const state = await readSystemState()

  const actions: PlannedAction[] = []

  switch (intent) {
    case 'STABILIZE_SYSTEM': {
      // Stabilization always refreshes chain state first.
      actions.push({
        type: 'RUN_SYNC',
        order: 1,
      })

      // Always run recon (core invariant check)
      actions.push({
        type: 'RUN_RECON',
        order: 2,
      })

      // Only clear DLQ if present
      actions.push({
        type: 'CLEAR_DEAD_LETTERS',
        order: 3,
        condition: (s) => s.hasDeadLetters,
      })

      // Escalation: if mismatches exist → pause
      if (state.hasMismatches) {
        actions.push({
          type: 'PAUSE_SYSTEM',
          order: 4,
        })
      }

      break
    }

    case 'PREPARE_SETTLEMENT': {
      actions.push({
        type: 'RUN_SYNC',
        order: 1,
        condition: (s) => !s.isSynced,
      })

      actions.push({
        type: 'VERIFY_CHAIN',
        order: 2,
      })

      actions.push({
        type: 'RUN_RECON',
        order: 3,
      })

      break
    }

    case 'RESUME_SAFE': {
      actions.push({
        type: 'VERIFY_SYSTEM_HEALTH',
        order: 1,
      })

      actions.push({
        type: 'RESUME_SYSTEM',
        order: 2,
      })

      break
    }
  }

  // sort by order to guarantee deterministic execution
  return actions.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}
