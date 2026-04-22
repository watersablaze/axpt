import { buildScenarios } from '@/domains/scenario/scenarioBuilder'
import { simulateScenario } from '@/domains/scenario/scenarioSimulator'
import { selectBestScenario } from '@/domains/scenario/scenarioSelector'
import { scoreConfidence } from '@/domains/predictive/predictivePolicy'
import { evaluateGovernor } from '@/domains/predictive/governor'
import { canAutoExecute } from './autonomyPolicy'

export async function runAutonomousStrategy(intent: string, assetCode?: string) {
  // 1. Build scenarios (can use assetCode for scenario building if needed)
  const scenarios = buildScenarios(intent, assetCode)

  // 2. Simulate all
  const results = await Promise.all(
    scenarios.map((s) => simulateScenario(s))
  )

  // 3. Pick best (with learning weighting)
  const best = await selectBestScenario(scenarios, results, intent)

  const bestResult = results.find(
    (r) => r.scenarioId === best.id
  )!

  // 4. Evaluate system state
  const systemState = await evaluateGovernor([])

  // 5. Compute confidence
  const confidence = scoreConfidence(
    bestResult.risks.map((r) => ({
      type: 'RETRY_PRESSURE' as const,
      severity:
        r.level === 'HIGH'
          ? 'CRITICAL'
          : r.level === 'MEDIUM'
          ? 'WARN'
          : 'INFO',
      message: r.message,
    }))
  )

  // 6. Decide autonomy
  const allowed = canAutoExecute({
    confidence,
    risks: bestResult.risks,
    systemState,
  })

  return {
    best,
    bestResult,
    confidence,
    allowed,
    systemState,
  }
}