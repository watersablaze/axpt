import { prisma } from '@/infrastructure/db/prisma'
import { snapshotSystemState } from '@/domains/learning/systemSnapshot'
import { selectBestIntent } from '@/domains/adaptive/intentSelector'
import { buildScenarios } from '@/domains/scenario/scenarioBuilder'
import { simulateScenario } from '@/domains/scenario/scenarioSimulator'
import { selectBestScenario } from '@/domains/scenario/scenarioSelector'
import { evaluateGovernor } from '@/domains/predictive/governor'
import { canAutonomouslyExecute } from './autonomousPolicy'
import { executeStrategy } from '@/domains/intent/strategyExecutor'
import type { IntentType } from '@/domains/intent/intentTypes'
import { runSelfCorrection } from '@/domains/learning/selfCorrection'
import { buildIntentWhy, type WhyExplanation } from '@/domains/explainability/whyEngine'
import { deriveSystemState } from '@/domains/learning/systemState'
import { persistWhy } from '@/domains/explainability/persistWhy'

export type AutonomousLoopResult = {
  executed: boolean
  decision: {
    allowed: boolean
    reason: string
    intent?: string
    scenarioId?: string
    confidence?: number
    why?: WhyExplanation
    assetCode?: string
    systemState?: string
  }
  actions?: { type: string }[]
}

export async function runAutonomousLoop(): Promise<AutonomousLoopResult> {
  const state = await snapshotSystemState()
  const adaptiveIntents = await selectBestIntent(state)
  const bestIntent = adaptiveIntents[0]

  if (!bestIntent) {
    return {
      executed: false,
      decision: {
        allowed: false,
        reason: 'No adaptive intent available',
      },
    }
  }

  const intent = bestIntent.intent as IntentType
  const scenarios = buildScenarios(intent)
  const results = await Promise.all(
    scenarios.map((scenario) => simulateScenario(scenario))
  )

  const bestScenario = await selectBestScenario(
    scenarios,
    results,
    intent
  )

  const bestResult = results.find((r) => r.scenarioId === bestScenario.id)
  if (!bestResult) {
    return {
      executed: false,
      decision: {
        allowed: false,
        reason: 'No scenario result available',
      },
    }
  }

  const selectedScenario = scenarios.find((s) => s.id === bestScenario.id)
  if (!selectedScenario) {
    return {
      executed: false,
      decision: {
        allowed: false,
        reason: 'No scenario selected',
      },
    }
  }

  const baseWhy = buildIntentWhy({
    intent,
    reasoning: [
      ...(bestIntent.reasoning ?? []),
      `Chosen scenario: ${selectedScenario.id}`,
    ],
    systemState: deriveSystemState(state),
    assetCode: bestIntent.assetCode,
  })
  const systemState = deriveSystemState(state)

  const governorState = await evaluateGovernor([])

  const confidence = Math.max(0, Math.min(1, bestIntent.score))
  const decision = canAutonomouslyExecute({
    governorState,
    confidence,
    risks: bestResult.risks,
    intent,
  })

  await prisma.circuitEvent.create({
    data: {
      type: 'AUTONOMOUS_DECISION',
      severity: decision.allowed ? 'INFO' : 'WARN',
      message: `${decision.allowed ? 'Approved' : 'Blocked'} autonomous intent: ${bestIntent.intent}`,
      metadata: {
        governorState,
        confidence,
        scenarioId: selectedScenario.id,
        reason: decision.reason,
      },
    },
  })

  if (!decision.allowed) {
    return {
      executed: false,
      decision: {
        allowed: false,
        reason: decision.reason,
        intent: bestIntent.intent,
        scenarioId: selectedScenario.id,
        confidence,
        why: baseWhy,
        assetCode: bestIntent.assetCode,
        systemState,
      },
    }
  }

  const correction = await runSelfCorrection({
    intent: bestIntent.intent,
  })

  if (correction.correctionMode === 'RESTRICT_AUTONOMY') {
    return {
      executed: false,
      decision: {
        allowed: false,
        reason: 'Autonomy restricted by self-correction layer',
        intent: bestIntent.intent,
        why: baseWhy,
        assetCode: bestIntent.assetCode,
        systemState,
      },
    }
  }

  let scenarioToExecute = selectedScenario
  if (correction.correctionMode === 'REPLAN' && correction.scenarioId) {
    const replannedScenario = scenarios.find((s) => s.id === correction.scenarioId)
    if (replannedScenario) {
      scenarioToExecute = replannedScenario
    }
  }

  const result = await executeStrategy({
    intent,
    scenarioId: scenarioToExecute.id,
    actions: scenarioToExecute.actions,
    context: {
      confidence,
    },
  })

  await prisma.circuitEvent.create({
    data: {
      type: 'AUTONOMOUS_EXECUTION',
      severity: result.success ? 'INFO' : 'CRITICAL',
      message: `Autonomous execution ${result.success ? 'succeeded' : 'failed'}: ${bestIntent.intent}`,
      metadata: {
        scenarioId: scenarioToExecute.id,
        confidence,
        impactScore: result.impactScore,
        correctionMode: correction.correctionMode,
      },
    },
  })

  const finalDecision = {
    allowed: true,
    reason: decision.reason,
    intent: bestIntent.intent,
    scenarioId: scenarioToExecute.id,
    confidence,
    why: buildIntentWhy({
      intent,
      reasoning: [
        ...(bestIntent.reasoning ?? []),
        `Chosen scenario: ${scenarioToExecute.id}`,
        `Correction mode: ${correction.correctionMode}`,
      ],
      systemState,
      assetCode: bestIntent.assetCode,
    }),
    assetCode: bestIntent.assetCode,
    systemState,
  }

  if (result.success && finalDecision.why) {
    await persistWhy({
      why: finalDecision.why,
      scenarioId: finalDecision.scenarioId,
      assetCode: finalDecision.assetCode,
      systemState: finalDecision.systemState,
      metadata: {
        autonomous: true,
      },
    })
  }

  return {
    executed: true,
    decision: finalDecision,
    actions: scenarioToExecute.actions,
  }
}
