import { readSystemState } from '@/domains/intent/systemState'
import { Scenario, ScenarioResult } from './scenarioTypes'

export async function simulateScenario(
  scenario: Scenario
): Promise<ScenarioResult> {
  const state = await readSystemState()

  const effects: string[] = []
  const risks: ScenarioResult['risks'] = []

  if (scenario.actions.find(a => a.type === 'RUN_SYNC')) {
    effects.push('Chain state synchronized')
  }

  if (scenario.actions.find(a => a.type === 'RUN_RECON')) {
    effects.push('Reconciliation performed')
  }

  if (scenario.actions.find(a => a.type === 'CLEAR_DEAD_LETTERS')) {
    effects.push('Dead-letter queue cleared')
  }

  if (scenario.actions.find(a => a.type === 'PAUSE_SYSTEM')) {
    effects.push('System paused')
    risks.push({
      level: 'HIGH',
      message: 'System-wide pause will halt operations',
    })
  }

  if (state.hasMismatches) {
    risks.push({
      level: 'MEDIUM',
      message: 'Existing mismatches present',
    })
  }

  return {
    scenarioId: scenario.id,
    effects,
    risks,
    score: scoreScenario(effects, risks),
  }
}

function scoreScenario(effects: string[], risks: any[]) {
  let score = effects.length * 10

  for (const r of risks) {
    if (r.level === 'HIGH') score -= 20
    if (r.level === 'MEDIUM') score -= 10
  }

  return score
}
