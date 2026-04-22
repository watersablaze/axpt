import { prisma } from '@/infrastructure/db/prisma'
import { TRANSACTION_TYPES } from '@/domains/wallet/constants/transactionTypes'

export type GraphEdge = {
  from: string
  to: string
  count: number
}

export async function buildTransferGraph(windowMinutes = 60): Promise<GraphEdge[]> {
  const txs = await prisma.transaction.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - windowMinutes * 60 * 1000),
      },
      type: TRANSACTION_TYPES.DEBIT,
    },
    select: {
      userId: true,
      metadata: true,
    },
  })

  const map = new Map<string, number>()

  for (const tx of txs) {
    const meta = tx.metadata as Record<string, unknown> | null
    const toUserId =
      typeof meta?.toUserId === 'string' ? meta.toUserId : null

    if (!toUserId) continue

    const key = `${tx.userId}->${toUserId}`
    map.set(key, (map.get(key) ?? 0) + 1)
  }

  return Array.from(map.entries()).map(([key, count]) => {
    const [from, to] = key.split('->')
    return { from, to, count }
  })
}