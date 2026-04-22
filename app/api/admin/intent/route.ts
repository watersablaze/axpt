import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/domains/auth/requirePermission'
import { PERMISSIONS } from '@/domains/auth/permissions'
import { planIntent } from '@/domains/intent/intentPlanner'
import { executeIntent } from '@/domains/intent/intentExecutor'
import { IntentType } from '@/domains/intent/intentTypes'
import { buildScenarios } from '@/domains/scenario/scenarioBuilder'
import { readSystemState } from '@/domains/intent/systemState'
import { buildIntentWhy } from '@/domains/explainability/whyEngine'
import { persistWhy } from '@/domains/explainability/persistWhy'
import { requireSystemHealthy } from '@/domains/system/requireSystemHealthy'

export type Args = {
  mismatchesBefore: number
  mismatchesAfter: number
  deadLettersBefore: number
  deadLettersAfter: number
  syncLagBefore: number
  syncLagAfter: number
}

export function computeImpactScore(args: Args): number {
  let score = 0

  // improvements
  if (args.mismatchesAfter < args.mismatchesBefore) score += 0.4
  if (args.deadLettersAfter < args.deadLettersBefore) score += 0.3
  if (args.syncLagAfter < args.syncLagBefore) score += 0.3

  // regressions
  if (args.mismatchesAfter > args.mismatchesBefore) score -= 0.4
  if (args.deadLettersAfter > args.deadLettersBefore) score -= 0.3
  if (args.syncLagAfter > args.syncLagBefore) score -= 0.3

  return Math.max(-1, Math.min(1, score))
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.TREASURY_EXECUTE_INTENT)

    const health = await requireSystemHealthy()
    if (!health.allowed) {
      return NextResponse.json(
        { ok: false, error: health.reason },
        { status: 503 }
      )
    }

    const {
      intent,
      scenarioId,
    }: {
      intent: IntentType
      scenarioId?: string
    } = await request.json()

    if (!intent) {
      return NextResponse.json({ error: 'Intent type required' }, { status: 400 })
    }

    let actions

    if (scenarioId) {
      const scenarios = buildScenarios(intent)
      const selected = scenarios.find((scenario) => scenario.id === scenarioId)

      if (!selected) {
        return NextResponse.json({ error: 'Scenario not found' }, { status: 400 })
      }

      actions = selected.actions
    } else {
      actions = await planIntent(intent, {})
    }

    const beforeState = await readSystemState()
    await executeIntent(intent, actions)
    const afterState = await readSystemState()

    const impactScore = computeImpactScore({
      mismatchesBefore: beforeState.mismatchCount,
      mismatchesAfter: afterState.mismatchCount,
      deadLettersBefore: beforeState.deadLetterCount,
      deadLettersAfter: afterState.deadLetterCount,
      syncLagBefore: beforeState.syncLagSeconds ?? 0,
      syncLagAfter: afterState.syncLagSeconds ?? 0,
    })

    const why = buildIntentWhy({
      intent,
      reasoning: actions.map((a: { type: string }) => a.type),
      systemState: 'EXECUTED',
    })

    await persistWhy({
      why,
      scenarioId,
      assetCode: null,
      systemState: 'EXECUTED',
      metadata: {
        actions,
      },
    })

    return NextResponse.json({
      ok: true,
      success: true,
      intent,
      scenarioId: scenarioId ?? null,
      actions,
      impactScore,
      why,
    })
  } catch (error) {
    console.error('Intent execution error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      {
        status:
          typeof error === 'object' &&
          error !== null &&
          'status' in error &&
          typeof error.status === 'number'
            ? error.status
            : 500,
      }
    )
  }
}
