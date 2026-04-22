import { prisma } from '@/infrastructure/db/prisma'
import { mergeUserMetadata } from './mergeUserMetadata'

type PersistRiskSnapshotInput = {
  userId: string
  riskScore: number
  riskLevel: string
  anomalyScore?: number
  trustScore?: number
  reason?: string
}

type PersistRiskSnapshotBatchItem = {
  userId: string
  riskScore: number
  riskLevel: string
  anomalyScore?: number
  trustScore?: number
  reason?: string
}

export async function persistRiskSnapshot(
  input: PersistRiskSnapshotInput
) {
  const {
    userId,
    riskScore,
    riskLevel,
    anomalyScore,
    trustScore,
    reason,
  } = input

  await mergeUserMetadata(userId, {
    riskScore,
    riskLevel,
    anomalyScore: anomalyScore ?? 0,
    trustScore: trustScore ?? 0,
    riskSnapshotAt: new Date().toISOString(),
    riskSnapshotReason: reason ?? 'Runtime risk evaluation',
  })

  await prisma.eventLog.create({
    data: {
      type: 'RISK_SNAPSHOT_PERSISTED',
      metadata: {
        userId,
        riskScore,
        riskLevel,
        anomalyScore: anomalyScore ?? null,
        trustScore: trustScore ?? null,
        reason: reason ?? null,
      },
    },
  })

  return { ok: true }
}

export async function persistRiskSnapshotBatch(
  items: PersistRiskSnapshotBatchItem[]
) {
  let updated = 0

  for (const item of items) {
    await persistRiskSnapshot(item)
    updated++
  }

  return { updated }
}