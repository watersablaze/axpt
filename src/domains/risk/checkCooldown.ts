import { prisma } from '@/infrastructure/db/prisma'
import { TRANSACTION_TYPES } from '@/domains/wallet/constants/transactionTypes'

export async function checkCooldown(params: {
  userId: string
  cooldownMs: number
  intent?: unknown
}) {
  const { userId, intent } = params
  let { cooldownMs } = params

  if (intent === 'TREASURY') {
    cooldownMs = Math.floor(cooldownMs * 0.5)
  }

  if (cooldownMs <= 0) {
    return { blocked: false as const }
  }

  const latest = await prisma.transaction.findFirst({
    where: {
      userId,
      type: TRANSACTION_TYPES.DEBIT,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      createdAt: true,
    },
  })

  if (!latest) {
    return { blocked: false as const }
  }

  const elapsed = Date.now() - new Date(latest.createdAt).getTime()

  if (elapsed < cooldownMs) {
    return {
      blocked: true as const,
      remainingMs: cooldownMs - elapsed,
    }
  }

  return { blocked: false as const }
}
