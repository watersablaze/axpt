import { prisma } from '@/infrastructure/db/prisma'
import { computeRiskScore } from '@/domains/risk/computeRiskScore'
import { getUserTrustScore } from '@/domains/trust/getUserTrustScore'
import { classifyRisk } from '@/domains/risk/classifyRisk'
import { persistRiskSnapshotBatch } from '@/domains/security/persistRiskSnapshotBatch'
import { persistClusterAssignments } from '@/domains/security/persistClusterAssignments'
import { detectMultiHopRisk } from '@/domains/risk/detectMultiHopRisk'
import { computeProbabilisticThreatField } from './computeProbabilisticThreatField'
import { persistProbabilisticThreatField } from './persistProbabilisticThreatField'
import { computeAnomalyScore } from '@/domains/risk/computeAnomalyScore'
import { decimalToBigInt } from '@/lib/money/baseUnits'
import { computeContainmentZone } from './computeContainmentZone'
import { persistContainmentZones } from './persistContainmentZones'
import { applyContainmentPolicy } from './applyContainmentPolicy'
import { evolveContainmentZones } from './evolveContainmentZones'
import { buildContainmentZoneId, normalizeContainmentZoneMembers } from './containmentZone'
import { computeZoneThrottle } from './computeZoneThrottle'
import { persistZoneThrottle } from './persistZoneThrottle'

export async function recomputeSecurityState(options?: { limit?: number }) {
  const limit = options?.limit ?? 100

  const users = await prisma.user.findMany({
    take: limit,
    select: { id: true },
  })

  const snapshotBatch: Array<{
    userId: string
    riskScore: number
    riskLevel: string
    anomalyScore?: number
    trustScore?: number
    reason?: string
  }> = []

  let clusterOps = 0
  const errors: Array<{ userId: string; error: string }> = []

  for (const user of users) {
    try {
      const lastTx = await prisma.transaction.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: {
          metadata: true,
          amountBaseUnits: true,
        },
      })

      if (!lastTx?.amountBaseUnits) {
        continue // skip users with no transactions
      }

      const recipientUserId =
        typeof (lastTx?.metadata as any)?.toUserId === 'string'
          ? (lastTx?.metadata as any).toUserId
          : user.id

      const amountBaseUnits = decimalToBigInt(lastTx.amountBaseUnits)

      const risk = await computeRiskScore({
        userId: user.id,
        amountBaseUnits,
        recipientUserId,
      })

      const riskLevel = classifyRisk(risk.score)
      const trust = await getUserTrustScore(user.id)

      const anomaly = await computeAnomalyScore({
        userId: user.id,
        recentAmount: amountBaseUnits,
        recipientUserId,
      })

      snapshotBatch.push({
        userId: user.id,
        riskScore: risk.score,
        riskLevel,
        anomalyScore: anomaly,
        trustScore: trust.score,
        reason: 'Periodic recompute',
      })

      if (recipientUserId !== user.id) {
        const multiHop = await detectMultiHopRisk({
          fromUserId: user.id,
          toUserId: recipientUserId,
        })

        const relatedUsers =
          Array.isArray((multiHop as any)?.relatedUsers)
            ? (multiHop as any).relatedUsers.filter(
                (id: unknown): id is string => typeof id === 'string'
              )
            : []

        if (multiHop.score >= 4 && relatedUsers.length > 0) {
          const clusterUserIds = normalizeContainmentZoneMembers([
            user.id,
            ...relatedUsers,
          ])
          const clusterId = buildContainmentZoneId(clusterUserIds)

          await persistClusterAssignments({
            clusterId,
            userIds: clusterUserIds,
            reason: 'Recompute cluster detection',
          })

          clusterOps++
        }
      }
    } catch (err) {
      console.error('[SECURITY_RECOMPUTE_USER_ERROR]', {
        userId: user.id,
        err,
      })

      errors.push({
        userId: user.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

    // 1. Persist user-level intelligence
    if (snapshotBatch.length > 0) {
      await persistRiskSnapshotBatch(snapshotBatch)
    }

    // 2. Build graph-level intelligence

    const threatField = await computeProbabilisticThreatField()
    await persistProbabilisticThreatField(threatField)

    // 3. Build zone-level intelligence
    const zones = await computeContainmentZone()

    // 4. Evolve zones over time
    const evolvedZones = await evolveContainmentZones(zones)

    // 5. Persist evolved zones
    await persistContainmentZones(evolvedZones)

    // 6. Enforce containment
    await applyContainmentPolicy(evolvedZones)

    // 7. Economic defense
    const throttles = computeZoneThrottle(evolvedZones)
    await persistZoneThrottle(throttles)


  await prisma.eventLog.create({
    data: {
      type: 'SECURITY_RECOMPUTE_COMPLETE',
      metadata: {
        usersProcessed: snapshotBatch.length,
        snapshotsPersisted: snapshotBatch.length,
        clustersAssigned: clusterOps,
        errorsCount: errors.length,
        errors,
        timestamp: new Date().toISOString(),
      },
    },
  })

  return {
    ok: true,
    processed: snapshotBatch.length,
    snapshotsPersisted: snapshotBatch.length,
    clustersAssigned: clusterOps,
    errors,
  }
}
