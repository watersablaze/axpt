import crypto from 'crypto'
import { prisma } from '@/infrastructure/db/prisma'
import type { PredictiveSignal } from './predictiveTypes'
import { GOVERNOR_CONFIG } from '@/domains/predictive/governorConfig'

export function hashSignals(signals: PredictiveSignal[]) {
  const base = signals
    .map((signal) => `${signal.type}:${signal.assetCode ?? 'global'}:${signal.value ?? 0}`)
    .sort()
    .join('|')

  return crypto.createHash('sha256').update(base).digest('hex')
}

export async function collectPredictiveSignals(): Promise<PredictiveSignal[]> {
  const signals: PredictiveSignal[] = []

  const [
    retryableCount,
    submittingCount,
    submittedCount,
    deadLetterCount,
    recentReconWarns,
    latestSyncEvent,
  ] = await Promise.all([
    prisma.chainMirrorJob.count({
      where: { status: 'RETRYABLE' },
    }),
    prisma.chainMirrorJob.count({
      where: { status: 'SUBMITTING' },
    }),
    prisma.chainMirrorJob.count({
      where: { status: 'SUBMITTED' },
    }),
    prisma.chainMirrorJob.count({
      where: { status: 'DEAD_LETTER' },
    }),
    prisma.circuitEvent.count({
      where: {
        type: 'RECON',
        severity: 'WARN',
      },
    }),
    prisma.circuitEvent.findFirst({
      where: { type: 'SYNC' },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const retryPressure = retryableCount + submittingCount + submittedCount
  if (retryPressure >= GOVERNOR_CONFIG.retryPressureWarn) {
    signals.push({
      type: 'RETRY_PRESSURE',
      severity:
        retryPressure >= GOVERNOR_CONFIG.retryPressureCritical
          ? 'CRITICAL'
          : 'WARN',
      message: `Retry pressure rising: ${retryPressure} jobs in-flight/retryable`,
      value: retryPressure,
    })
  }

  if (deadLetterCount > 0) {
    signals.push({
      type: 'DEAD_LETTER_PRESENT',
      severity: 'CRITICAL',
      message: `Dead-letter jobs present: ${deadLetterCount}`,
      value: deadLetterCount,
    })
  }

  if (recentReconWarns >= GOVERNOR_CONFIG.reconWarnRepeatThreshold) {
    signals.push({
      type: 'RECON_INSTABILITY',
      severity:
        recentReconWarns >= GOVERNOR_CONFIG.reconCriticalRepeatThreshold
          ? 'CRITICAL'
          : 'WARN',
      message: `Repeated reconciliation warnings: ${recentReconWarns}`,
      value: recentReconWarns,
    })
  }

  if (latestSyncEvent?.createdAt) {
    const lagSeconds =
      (Date.now() - new Date(latestSyncEvent.createdAt).getTime()) / 1000

    if (lagSeconds > GOVERNOR_CONFIG.syncLagWarnSeconds) {
      signals.push({
        type: 'SYNC_LAG_RISING',
        severity:
          lagSeconds > GOVERNOR_CONFIG.syncLagCriticalSeconds
            ? 'CRITICAL'
            : 'WARN',
        message: `Chain sync lag detected: ${Math.floor(lagSeconds)}s`,
        value: Math.floor(lagSeconds),
      })
    }
  }

  const stressedAssets = await prisma.chainMirrorJob.groupBy({
    by: ['assetCode'],
    _count: true,
    where: {
      status: { in: ['RETRYABLE', 'DEAD_LETTER'] },
    },
  })

  for (const row of stressedAssets) {
    if (!row.assetCode) continue

    signals.push({
      type: 'ASSET_STRESS',
      severity:
        row._count >= GOVERNOR_CONFIG.assetStressCritical
          ? 'CRITICAL'
          : 'WARN',
      assetCode: row.assetCode,
      message: `Asset stress detected for ${row.assetCode}: ${row._count} stressed jobs`,
      value: row._count,
    })
  }

  return signals
}
