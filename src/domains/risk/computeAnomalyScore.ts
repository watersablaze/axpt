import { prisma } from '@/infrastructure/db/prisma'

type Input = {
  userId: string
  recentAmount: bigint
  recipientUserId: string
}

function normalize(value: number, max: number) {
  return Math.min(1, value / max)
}

export async function computeAnomalyScore(input: Input): Promise<number> {
  const { userId, recentAmount, recipientUserId } = input

  const recentTxs = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 25,
    select: {
      amountBaseUnits: true,
      toUserId: true,
      createdAt: true,
    },
  })

  if (recentTxs.length === 0) {
    return 0.2 // new user baseline anomaly
  }

  // ──────────────────────────────
  // 1. Amount deviation
  // ──────────────────────────────

  const avgAmount =
    recentTxs.reduce((sum, tx) => sum + Number(tx.amountBaseUnits), 0) /
    recentTxs.length

  const amountDeviation = Math.abs(Number(recentAmount) - avgAmount)

  const amountScore = normalize(amountDeviation, avgAmount * 3 || 1)

  // ──────────────────────────────
  // 2. Recipient novelty
  // ──────────────────────────────

  const knownRecipients = new Set(recentTxs.map((tx) => tx.toUserId))
  const isNewRecipient = !knownRecipients.has(recipientUserId)

  const recipientScore = isNewRecipient ? 0.6 : 0

  // ──────────────────────────────
  // 3. Velocity anomaly
  // ──────────────────────────────

  const now = Date.now()
  const recentWindow = 5 * 60 * 1000

  const txCountRecent = recentTxs.filter(
    (tx) => now - new Date(tx.createdAt).getTime() < recentWindow
  ).length

  const velocityScore = normalize(txCountRecent, 10)

  // ──────────────────────────────
  // 4. Combine
  // ──────────────────────────────

  const anomaly =
    amountScore * 0.4 +
    recipientScore * 0.35 +
    velocityScore * 0.25

  return Number(anomaly.toFixed(4))
}