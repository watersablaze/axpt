import { prisma } from '@/infrastructure/db/prisma'
import { normalizeContainmentZoneMembers } from './containmentZone'

type ClusterAssignmentInput = {
  clusterId: string
  userIds: string[]
  reason?: string
}

export async function persistClusterAssignments(
  input: ClusterAssignmentInput
) {
  const { clusterId, reason } = input
  const userIds = normalizeContainmentZoneMembers(input.userIds)

  if (!clusterId || userIds.length === 0) {
    return { updated: 0 }
  }

  let updated = 0

  for (const userId of userIds) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    })

    const metadata = (user?.metadata as Record<string, unknown> | null) ?? {}
    const clusterChanged = metadata.clusterId !== clusterId

    if (!clusterChanged) {
      continue
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...metadata,
          clusterId,
          clusterAssignedAt: new Date().toISOString(),
          clusterReason: reason ?? 'Cluster containment assignment',
        },
      },
    })

    updated++
  }

  if (updated > 0) {
    await prisma.eventLog.create({
      data: {
        type: 'CLUSTER_ASSIGNMENT_PERSISTED',
        metadata: {
          clusterId,
          userIds,
          count: userIds.length,
          reason: reason ?? null,
        },
      },
    })
  }

  return { updated }
}
