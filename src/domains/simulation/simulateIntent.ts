import { planIntent } from '@/domains/intent/intentPlanner'
import { readSystemState } from '@/domains/intent/systemState'
import type { SimulationResult } from './simulateTypes'

export async function simulateIntent(
  intent: string,
  context: any
): Promise<SimulationResult> {
  const state = await readSystemState()

  const actions = await planIntent(intent as any, context)

  const simulatedActions = actions.map((a) => ({
    type: a.type,
    willExecute: a.condition ? a.condition(state) : true,
  }))

  const effects: SimulationResult['effects'] = []
  const risks: SimulationResult['risks'] = []

  // Effects
  if (simulatedActions.some((a) => a.type === 'RUN_SYNC')) {
    effects.push({
      description: 'Chain state will be synchronized',
    })
  }

  if (simulatedActions.some((a) => a.type === 'RUN_RECON')) {
    effects.push({
      description: 'Reconciliation will update system state',
    })
  }

  if (simulatedActions.some((a) => a.type === 'PAUSE_SYSTEM')) {
    effects.push({
      description: 'System will enter PAUSED state',
    })

    risks.push({
      level: 'HIGH',
      message: 'System-wide pause will halt operations',
    })
  }

  // Risk: mismatch present
  if (state.hasMismatches) {
    risks.push({
      level: 'MEDIUM',
      message: 'Existing mismatches may affect execution outcome',
    })
  }

  return {
    intent,
    actions: simulatedActions,
    effects,
    risks,
  }
}
