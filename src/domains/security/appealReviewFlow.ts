import { prisma } from '@/infrastructure/db/prisma'
import { unfreezeUser } from './unfreezeUser'
import { clearQuarantine } from './quarantineState'

export async function appealReviewFlow(params: {
  userId: string
  decision: 'APPROVE' | 'REJECT'
  reason: string
  reviewedByUserId: string
}) {
  const { userId, decision, reason, reviewedByUserId } = params

  await prisma.eventLog.create({
    data: {
      type: 'APPEAL_REVIEW',
      metadata: {
        userId,
        decision,
        reason,
        reviewedByUserId,
      },
    },
  })

  if (decision === 'APPROVE') {
    await unfreezeUser({
      userId,
      reason,
      reviewedByUserId,
    })

    await clearQuarantine(userId)
  }

  return {
    ok: true,
    decision,
  }
}