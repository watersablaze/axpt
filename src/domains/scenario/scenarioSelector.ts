import { Scenario, ScenarioResult } from './scenarioTypes'
import { prisma } from '@/lib/prisma'

/**
 * Retrieve historical outcomes for a given intent
 * Enables experience-aware decision making
 */
async function getScenarioHistory(intent: string) {
  return prisma.strategyOutcome.findMany({
    where: { intent },
  })
}

/**
 * Adjust base score using historical effectiveness
 * Weight recent successful outcomes to favor proven strategies
 */
function adjustScoreWithHistory(
  scenarioId: string,
  baseScore: number,
  history: any[]
) {
  const relevant = history.filter(h => h.scenarioId === scenarioId)

  if (!relevant.length) return baseScore

  const avgImpact =
    relevant.reduce((sum, r) => sum + (r.impactScore ?? 0), 0) /
    relevant.length

  return baseScore + avgImpact * 10
}

export async function selectBestScenario(
  scenarios: Scenario[],
  results: ScenarioResult[],
  intent?: string
): Promise<Scenario> {
  // Apply learning weighting if intent provided
  let adjustedResults = results
  
  if (intent) {
    const history = await getScenarioHistory(intent)
    adjustedResults = results.map(r => ({
      ...r,
      score: adjustScoreWithHistory(r.scenarioId, r.score, history),
    }))
  }

  const best = adjustedResults.sort((a, b) => b.score - a.score)[0]

  return scenarios.find((s) => s.id === best.scenarioId)!
}