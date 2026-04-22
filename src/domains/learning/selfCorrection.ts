import { prisma } from '@/infrastructure/db/prisma'
import { detectDrift } from './driftDetection'
import { getCorrectionMode } from './correctionPolicy'
import { buildScenarios } from '@/domains/scenario/scenarioEngine'

export async function runSelfCorrection(args: {
  intent: string
  assetCode?: string
}) {
  const outcomes = await prisma.strategyOutcome.findMany({
    where: {
      intent: args.intent,
      ...(args.assetCode ? { assetCode: args.assetCode } : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: {
      success: true,
      impactScore: true,
      createdAt: true,
    },
  })

  const drift = detectDrift(outcomes)

  const governor = await prisma.systemGovernor.findUnique({
    where: { id: 'global' },
  })

  const governorState = governor?.currentState ?? 'STABLE'
  const correctionMode = getCorrectionMode({
    driftScore: drift.driftScore,
    governorState,
  })

  await prisma.circuitEvent.create({
    data: {
      type: 'DRIFT_DETECTION',
      severity: drift.isDrifting ? 'WARN' : 'INFO',
      message: drift.isDrifting
        ? `Strategy drift detected for ${args.intent}`
        : `No significant drift for ${args.intent}`,
      metadata: {
        intent: args.intent,
        assetCode: args.assetCode ?? null,
        driftScore: drift.driftScore,
        recentRate: drift.recentRate,
        historicalRate: drift.historicalRate,
        correctionMode,
      },
    },
  })

  if (!drift.isDrifting || correctionMode === 'NONE') {
    return {
      drift,
      correctionMode,
      corrected: false,
    }
  }

  if (correctionMode === 'RESTRICT_AUTONOMY') {
    await prisma.circuitEvent.create({
      data: {
        type: 'DRIFT_CORRECTION',
        severity: 'CRITICAL',
        message: `Autonomy restricted due to drift on ${args.intent}`,
        metadata: {
          intent: args.intent,
          assetCode: args.assetCode ?? null,
          correctionMode,
        },
      },
    })

    return {
      drift,
      correctionMode,
      corrected: true,
      action: 'AUTONOMY_RESTRICTED',
    }
  }

  if (correctionMode === 'ADVISORY') {
    return {
      drift,
      correctionMode,
      corrected: true,
      action: 'ADVISORY_ONLY',
    }
  }

  if (correctionMode === 'REPLAN') {
    const scenarios = await buildScenarios(args.intent, args.assetCode)
    const best = [...scenarios].sort((a, b) => b.score - a.score)[0]

    await prisma.circuitEvent.create({
      data: {
        type: 'DRIFT_CORRECTION',
        severity: 'WARN',
        message: `Replan triggered for ${args.intent}`,
        metadata: {
          intent: args.intent,
          assetCode: args.assetCode ?? null,
          correctionMode,
          selectedScenarioId: best.id,
        },
      },
    })

    return {
      drift,
      correctionMode,
      corrected: true,
      action: 'REPLAN',
      scenarioId: best?.id,
    }
  }

  return {
    drift,
    correctionMode,
    corrected: false,
  }
}
