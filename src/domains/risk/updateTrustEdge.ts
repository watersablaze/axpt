import { prisma } from '@/infrastructure/db/prisma'

export async function updateTrustEdge(params: {
  fromUserId: string
  toUserId: string
  success: boolean
}) {
  const { fromUserId, toUserId, success } = params

  const edge = await prisma.userTrustEdge.upsert({
    where: {
      fromUserId_toUserId: {
        fromUserId,
        toUserId,
      },
    },
    update: {},
    create: {
      fromUserId,
      toUserId,
    },
  })

  const nextTransferCount = edge.transferCount + 1
  const nextSuccess = edge.successfulCount + (success ? 1 : 0)
  const nextFailed = edge.failedCount + (success ? 0 : 1)

  const recencyBoost = edge.lastTransferAt
    ? Math.max(
        0,
        1 -
          (Date.now() - new Date(edge.lastTransferAt).getTime()) /
            (1000 * 60 * 60 * 24)
      )
    : 0

  const trustDelta = success ? 0.5 + recencyBoost : -1.2

  const nextTrustScore = edge.trustScore + trustDelta

  await prisma.userTrustEdge.update({
    where: { id: edge.id },
    data: {
      transferCount: nextTransferCount,
      successfulCount: nextSuccess,
      failedCount: nextFailed,
      trustScore: nextTrustScore,
      lastTransferAt: new Date(),
    },
  })
}
