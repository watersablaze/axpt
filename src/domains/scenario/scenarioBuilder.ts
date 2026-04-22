import { Scenario } from './scenarioTypes'

export function buildScenarios(intent: string, assetCode?: string): Scenario[] {
  if (intent === 'STABILIZE_SYSTEM') {
    return [
      {
        id: 'minimal',
        label: 'Minimal Stabilization',
        actions: [
          { type: 'RUN_SYNC' },
          { type: 'RUN_RECON' },
        ],
      },
      {
        id: 'standard',
        label: 'Standard Stabilization',
        actions: [
          { type: 'RUN_SYNC' },
          { type: 'RUN_RECON' },
          { type: 'CLEAR_DEAD_LETTERS' },
        ],
      },
      {
        id: 'aggressive',
        label: 'Aggressive Stabilization',
        actions: [
          { type: 'RUN_SYNC' },
          { type: 'RUN_RECON' },
          { type: 'CLEAR_DEAD_LETTERS' },
          { type: 'PAUSE_SYSTEM' },
        ],
      },
    ]
  }

  return []
}