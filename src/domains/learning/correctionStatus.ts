import { prisma } from '@/infrastructure/db/prisma'

export async function getCorrectionStatus() {
  const [drift, correction, autonomy, governor] = await Promise.all([
    prisma.circuitEvent.findFirst({
      where: { type: 'DRIFT_DETECTION' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.circuitEvent.findFirst({
      where: { type: 'DRIFT_CORRECTION' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.circuitEvent.findFirst({
      where: { type: 'AUTONOMOUS_DECISION' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.systemGovernor.findUnique({
      where: { id: 'global' },
    }),
  ])

  const driftMeta = (drift?.metadata ?? {}) as Record<string, unknown>
  const correctionMeta = (correction?.metadata ?? {}) as Record<string, unknown>
  const autonomyMeta = (autonomy?.metadata ?? {}) as Record<string, unknown>

  return {
    governorState: governor?.currentState ?? 'STABLE',
    lastDrift: drift
      ? {
          message: drift.message,
          severity: drift.severity,
          createdAt: drift.createdAt.toISOString(),
          driftScore: Number(driftMeta.driftScore ?? 0),
          recentRate: Number(driftMeta.recentRate ?? 0),
          historicalRate: Number(driftMeta.historicalRate ?? 0),
          correctionMode: String(driftMeta.correctionMode ?? 'NONE'),
        }
      : null,
    lastCorrection: correction
      ? {
          message: correction.message,
          severity: correction.severity,
          createdAt: correction.createdAt.toISOString(),
          correctionMode: String(correctionMeta.correctionMode ?? 'NONE'),
          selectedScenarioId: correctionMeta.selectedScenarioId
            ? String(correctionMeta.selectedScenarioId)
            : null,
        }
      : null,
    lastAutonomy: autonomy
      ? {
          message: autonomy.message,
          severity: autonomy.severity,
          createdAt: autonomy.createdAt.toISOString(),
          reason: String(autonomyMeta.reason ?? '—'),
          confidence: Number(autonomyMeta.confidence ?? 0),
          scenarioId: autonomyMeta.scenarioId
            ? String(autonomyMeta.scenarioId)
            : null,
          allowed: autonomy.severity !== 'WARN',
        }
      : null,
  }
}