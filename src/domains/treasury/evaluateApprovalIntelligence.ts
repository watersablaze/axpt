import { prisma } from '@/infrastructure/db/prisma'
import { TRANSACTION_TYPES } from '@/domains/wallet/constants/transactionTypes'

export async function evaluateApprovalIntelligence(actionId: string) {
  const action = await prisma.treasuryAction.findUnique({
    where: { id: actionId },
  })

  if (!action) return null

  const amount = Number(action.amountBaseUnits) / 1_000_000

  const history = await prisma.transaction.aggregate({
    _avg: { amountBaseUnits: true },
    _count: true,
    where: {
      userId: action.initiatorUserId,
      type: TRANSACTION_TYPES.DEBIT,
    },
  })

  const avg = Number(history._avg.amountBaseUnits ?? 0) / 1_000_000

  let flags: string[] = []
  let riskScore = 0

  // 🔹 Size anomaly
  if (avg > 0 && amount > avg * 5) {
    flags.push('UNUSUAL_SIZE')
    riskScore += 3
  }

  // 🔹 Large transfer
  if (amount > 250) {
    flags.push('LARGE_TRANSFER')
    riskScore += 2
  }

  // 🔹 New user behavior
  if ((history._count ?? 0) < 3) {
    flags.push('LOW_HISTORY')
    riskScore += 2
  }

  return {
    riskScore,
    flags,
    avgHistoricalAmount: avg,
    currentAmount: amount,
  }
}