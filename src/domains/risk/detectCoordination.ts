import { prisma } from '@/infrastructure/db/prisma'

export async function detectCoordinatedBehavior(params: {
  userId: string
}) {
  const { userId } = params

  const windowMs = 5 * 60 * 1000 // 5 minutes

  const recent = await prisma.transaction.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - windowMs),
      },
    },
    select: {
      userId: true,
      metadata: true,
    },
  })

  // Group by recipient
  const recipientMap = new Map<string, Set<string>>()

  for (const tx of recent) {
    const meta = tx.metadata as Record<string, unknown> | null
    const to = meta?.toUserId

    if (typeof to !== 'string' || to.length === 0) continue

    if (!recipientMap.has(to)) {
      recipientMap.set(to, new Set())
    }

    recipientMap.get(to)!.add(tx.userId)
  }

  let score = 0
  const reasons: string[] = []

  for (const [recipient, senders] of recipientMap.entries()) {
    if (senders.has(userId) && senders.size >= 3) {
      score += 4
      reasons.push(`MULTI_SENDER_CLUSTER:${recipient}`)
    }
  }

  // Detect circular flow (basic)
  const pairs = new Set(
    recent.map((tx: { userId: string; metadata: unknown }) => {
      const meta = tx.metadata as Record<string, unknown> | null
      const toUserId = typeof meta?.toUserId === 'string' ? meta.toUserId : ''
      return `${tx.userId}->${toUserId}`
    })
  )

  for (const pair of pairs as Set<string>) {
    const [a, b] = pair.split('->')
    if ((a === userId || b === userId) && b && pairs.has(`${b}->${a}`)) {
      score += 3
      reasons.push('CIRCULAR_FLOW')
      break
    }
  }

  return { score, reasons }
}
