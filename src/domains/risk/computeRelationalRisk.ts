import { prisma } from '@/infrastructure/db/prisma'
import { applyTrustDecay } from './applyTrustDecay'

export async function computeRelationalRisk(params: {
  fromUserId: string
  toUserId: string
}) {
  const { fromUserId, toUserId } = params

  const edge = await prisma.userTrustEdge.findUnique({
    where: {
      fromUserId_toUserId: {
        fromUserId,
        toUserId,
      },
    },
  })

  let score = 0
  const reasons: string[] = []

  // 🆕 Brand new relationship
  if (!edge) {
    score += 3
    reasons.push('NEW_RELATIONSHIP')
    return { score, reasons }
  }

  const decayedTrust = applyTrustDecay({
    trustScore: edge.trustScore,
    lastUpdatedAt: edge.updatedAt,
  })
  const hoursSinceLast =
    (Date.now() - new Date(edge.lastTransferAt ?? 0).getTime()) /
    (1000 * 60 * 60)

  // 🔻 Low interaction history
  if (edge.transferCount < 3) {
    score += 2
    reasons.push('LOW_HISTORY')
  }

  // ⚠️ More failures than success
  if (edge.failedCount > edge.successfulCount) {
    score += 3
    reasons.push('UNSTABLE_RELATIONSHIP')
  }

  if (hoursSinceLast < 1) {
    score -= 1
    reasons.push('RECENT_ACTIVITY')
  }

  if (hoursSinceLast > 72) {
    score += 1
    reasons.push('STALE_RELATIONSHIP')
  }

  // 🧊 Negative trust
  if (decayedTrust < 0) {
    score += 2
    reasons.push('NEGATIVE_TRUST')
  }

  // 🔥 Strong trust reduces risk
  if (decayedTrust > 5) {
    score -= 2
    reasons.push('HIGH_TRUST')
  }

  return { score, reasons }
}
