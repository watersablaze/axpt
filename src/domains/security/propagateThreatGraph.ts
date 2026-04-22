import { prisma } from '@/infrastructure/db/prisma'
import { getUserMetadata, mergeUserMetadata } from './mergeUserMetadata'

export async function propagateThreatGraph(params: {
  triggerUserId: string
  depth?: number
}) {
  const { triggerUserId, depth = 2 } = params

  const visited = new Set<string>()
  const queue: Array<{ userId: string; level: number; sourceUserId?: string }> =
    [{ userId: triggerUserId, level: 0 }]

  let affected = 0

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

    const { userId, level, sourceUserId } = current

    if (visited.has(userId)) continue
    visited.add(userId)

    if (level > depth) continue

    const edges = await prisma.userTrustEdge.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      select: {
        fromUserId: true,
        toUserId: true,
        trustScore: true,
        failedCount: true,
        transferCount: true,
      },
    })

    for (const edge of edges) {
      const neighbor =
        edge.fromUserId === userId ? edge.toUserId : edge.fromUserId

      if (visited.has(neighbor)) continue

      const meta = await getUserMetadata(neighbor)

      const priorRisk = Number(meta.riskScore ?? 0)
      const edgePenalty =
        (edge.failedCount > 0 ? edge.failedCount : 0) +
        (edge.trustScore < 0 ? 2 : 0) +
        (edge.transferCount > 8 ? 1 : 0)

      const propagatedRisk = priorRisk + edgePenalty

      const shouldMark =
        propagatedRisk > priorRisk ||
        edge.failedCount > 0 ||
        edge.trustScore < 0

      if (shouldMark) {
        await mergeUserMetadata(neighbor, {
          riskScore: propagatedRisk,
          propagated: true,
          propagatedFrom: sourceUserId ?? triggerUserId,
          propagatedAt: new Date().toISOString(),
          propagationDepth: level + 1,
        })

        await prisma.eventLog.create({
          data: {
            type: 'THREAT_PROPAGATION',
            metadata: {
              triggerUserId,
              sourceUserId: userId,
              targetUserId: neighbor,
              depth: level + 1,
              edgePenalty,
              propagatedRisk,
            },
          },
        })

        affected++
      }

      queue.push({
        userId: neighbor,
        level: level + 1,
        sourceUserId: userId,
      })
    }
  }

  return { affected }
}