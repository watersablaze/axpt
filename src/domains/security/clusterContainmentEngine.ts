import { prisma } from '@/infrastructure/db/prisma'
import { computeAdaptiveContainment } from './computeAdaptiveContainment'
import { getUserMetadata, mergeUserMetadata } from './mergeUserMetadata'

type ClusterNode = {
  userId: string
  clusterId?: string | null
  riskScore: number
  anomalyScore: number
}

export async function clusterContainmentEngine(params?: {
  triggerUserId?: string
}) {
  let users: Array<{ id: string; metadata: unknown }> = []

  if (params?.triggerUserId) {
    const triggerMeta = await getUserMetadata(params.triggerUserId)
    const clusterId = triggerMeta.clusterId

    if (!clusterId || typeof clusterId !== 'string') {
      return { containedUsers: 0 }
    }

    users = await prisma.user.findMany({
      where: {
        metadata: {
          path: ['clusterId'],
          equals: clusterId,
        },
      },
      select: {
        id: true,
        metadata: true,
      },
    })
  } else {
    users = await prisma.user.findMany({
      select: {
        id: true,
        metadata: true,
      },
    })
  }

  const clusters = new Map<string, ClusterNode[]>()

  for (const u of users) {
    const meta = (u.metadata as Record<string, unknown> | null) ?? {}
    const clusterId =
      typeof meta.clusterId === 'string' ? meta.clusterId : null

    if (!clusterId) continue

    const node: ClusterNode = {
      userId: u.id,
      clusterId,
      riskScore: Number(meta.riskScore ?? 0),
      anomalyScore: Number(meta.anomalyScore ?? 0),
    }

    if (!clusters.has(clusterId)) {
      clusters.set(clusterId, [])
    }

    clusters.get(clusterId)!.push(node)
  }

  let contained = 0

  for (const [clusterId, members] of clusters.entries()) {
    const avgRisk =
      members.reduce((sum, m) => sum + m.riskScore, 0) / members.length

    const anomalyDensity =
      members.filter((m) => m.anomalyScore > 0.7).length / members.length

    const clusterReasons: string[] = []

    if (avgRisk > 7) {
      clusterReasons.push(`CLUSTER_AVG_RISK:${avgRisk.toFixed(2)}`)
    }

    if (anomalyDensity > 0.5) {
      clusterReasons.push(
        `CLUSTER_ANOMALY_DENSITY:${anomalyDensity.toFixed(2)}`
      )
    }

    for (const member of members) {
      const meta = await getUserMetadata(member.userId)

      const decision = computeAdaptiveContainment({
        riskScore: member.riskScore,
        anomalyScore: member.anomalyScore,
        clusterRisk: avgRisk,
      })

      const combinedReasons = [
        ...decision.reason,
        ...clusterReasons,
      ]

      const shouldQuarantine =
        decision.shouldQuarantine ||
        avgRisk > 7 ||
        anomalyDensity > 0.5

      if (!shouldQuarantine) continue

      await mergeUserMetadata(member.userId, {
        quarantine: true,
        quarantineReason:
          combinedReasons.length > 0
            ? combinedReasons
            : ['CLUSTER_CONTAINMENT'],
        containmentSeverity: decision.severity,
        clusterId,
        clusterRisk: avgRisk,
        anomalyDensity,
        containmentUpdatedAt: new Date().toISOString(),
      })

      contained++
    }
  }

  return { containedUsers: contained }
}