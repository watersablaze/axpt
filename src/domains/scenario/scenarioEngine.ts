import { getScenarioHistoryStats } from '@/domains/learning/strategyLearning'
import { applyLearningAdjustment } from '@/domains/learning/outcomeScoring'
import { buildIntentWhy } from '@/domains/explainability/whyEngine'

type ScenarioRisk = { level: 'LOW' | 'MEDIUM' | 'HIGH' }

type Scenario = {
  id: string
  actions: { type: string }[]
  effects: string[]
  risks: ScenarioRisk[]
  score: number
  reasoning: string[]
  baseScore: number
  learningDelta: number
  why: {
    summary: string
    factors: string[]
  }
}

export async function buildScenarios(
  intent: string,
  assetCode?: string
): Promise<Scenario[]> {
  const base = [
    {
      id: 'MINIMAL',
      actions: [{ type: 'RUN_RECON' }],
      effects: ['Low disruption'],
      risks: [] as ScenarioRisk[],
    },
    {
      id: 'BALANCED',
      actions: [{ type: 'RUN_RECON' }, { type: 'RUN_SYNC' }],
      effects: ['Moderate stabilization'],
      risks: [{ level: 'LOW' }] as ScenarioRisk[],
    },
    {
      id: 'AGGRESSIVE',
      actions: [
        { type: 'RUN_RECON' },
        { type: 'CLEAR_DEAD_LETTERS' },
        { type: 'RUN_SYNC' },
      ],
      effects: ['Full stabilization'],
      risks: [{ level: 'HIGH' }] as ScenarioRisk[],
    },
  ]

  const history = await getScenarioHistoryStats(intent, assetCode)

  return base.map((s) => {
    const riskPenalty =
      s.risks.length > 0
        ? s.risks.some((r) => r.level === 'HIGH')
          ? 0.5
          : 0.2
        : 0

    const benefit = s.actions.length * 0.4
    const disruption = s.actions.length * 0.1

    const baseScore = benefit - riskPenalty - disruption

    const learned = applyLearningAdjustment({
      baseScore,
      history: history[s.id],
    })

    const reasoning = [
      `Benefit: ${benefit.toFixed(2)}`,
      `Risk penalty: ${riskPenalty.toFixed(2)}`,
      `Disruption: ${disruption.toFixed(2)}`,
      ...learned.learningReasoning,
    ]

    return {
      ...s,
      baseScore,
      score: learned.finalScore,
      learningDelta: learned.learningDelta,
      reasoning,
      why: buildIntentWhy({
        intent: intent as any,
        reasoning,
        assetCode,
      }),
    }
  })
}
