import { prisma } from '@/infrastructure/db/prisma'
import { computeClusterScore } from './computeClusterScore'
import { detectCoordinatedBehavior } from './detectCoordination'
import { detectMultiHopRisk } from './detectMultiHopRisk'
import { computeRelationalRisk } from './computeRelationalRisk'

export async function computeRiskScore(params: {
  userId: string
  amountBaseUnits: bigint
  recipientUserId: string
}) {
  const { userId, amountBaseUnits, recipientUserId } = params

  let score = 0

  // 🔹 1. Velocity risk (too many recent tx)
  const recent = await prisma.transaction.count({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 60 * 1000),
      },
    },
  })

  if (recent > 5) score += 2

  // 🔹 2. Amount anomaly
  const avg = await prisma.transaction.aggregate({
    _avg: { amountBaseUnits: true },
    where: { userId },
  })

  const avgValue = BigInt(String(avg._avg.amountBaseUnits ?? 0))
  const current = amountBaseUnits

  if (avgValue > 0n && current > avgValue * 5n) {
    score += 3
  }

  // 🔹 3. New recipient risk
  const prior = await prisma.transaction.count({
    where: {
      userId,
      OR: [
        {
          metadata: {
            path: ['toUserId'],
            equals: recipientUserId,
          },
        },
        {
          metadata: {
            path: ['recipientUserId'],
            equals: recipientUserId,
          },
        },
      ],
    },
  })

  if (prior === 0) score += 2

  const relationalRisk = await computeRelationalRisk({
    fromUserId: userId,
    toUserId: recipientUserId,
  })

  score += relationalRisk.score
  const reasons = [...relationalRisk.reasons]

  const coordination = await detectCoordinatedBehavior({
    userId,
  })

  score += coordination.score
  reasons.push(...coordination.reasons)

  const multiHop = await detectMultiHopRisk({
    fromUserId: userId,
    toUserId: recipientUserId,
  })

  score += multiHop.score
  reasons.push(...multiHop.reasons)

  const cluster = await computeClusterScore(userId)

  score += cluster.score
  reasons.push(...cluster.reasons)

  return {
    score,
    reasons,
  }
}
