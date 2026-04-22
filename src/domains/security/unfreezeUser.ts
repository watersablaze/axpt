import { prisma } from '@/infrastructure/db/prisma'
import { mergeUserMetadata } from './mergeUserMetadata'

export async function unfreezeUser(params: {
  userId: string
  reason: string
  reviewedByUserId?: string
}) {
  const { userId, reason, reviewedByUserId } = params

  await mergeUserMetadata(userId, {
    frozen: false,
    frozenReason: null,
    unfrozenAt: new Date().toISOString(),
    unfreezeReason: reason,
    unfreezeReviewedByUserId: reviewedByUserId ?? null,
  })

  await prisma.eventLog.create({
    data: {
      type: 'USER_UNFROZEN',
      metadata: {
        userId,
        reason,
        reviewedByUserId: reviewedByUserId ?? null,
      },
    },
  })
}