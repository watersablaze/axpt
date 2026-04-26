import { prisma } from '@/infrastructure/db/prisma'
import {
  TREASURY_QUEUE_STATUS,
} from './stateMachine'
import { transitionTreasuryQueue } from './transitionTreasuryQueue'

export async function claimTreasuryExecutionJob(
  workerId: string
) {
  const now = new Date()

  const reclaimThreshold = new Date(
    Date.now() - 5 * 60 * 1000
  )

  const job =
    await prisma.treasuryExecutionQueue.findFirst({
      where: {
        OR: [
          {
            status: TREASURY_QUEUE_STATUS.PENDING,

            OR: [
              { nextRetryAt: null },

              {
                nextRetryAt: {
                  lte: now,
                },
              },
            ],
          },

          /**
           * reclaim abandoned jobs
           */
          {
            status: TREASURY_QUEUE_STATUS.CLAIMED,

            claimedAt: {
              lte: reclaimThreshold,
            },
          },
        ],
      },

      orderBy: {
        createdAt: 'asc',
      },
    })

  if (!job) {
    return null
  }

  const isInitialClaim =
    job.status === TREASURY_QUEUE_STATUS.PENDING

  if (!isInitialClaim) {
    const claimed =
      await prisma.treasuryExecutionQueue.updateMany({
        where: {
          id: job.id,
          status: job.status,
        },
        data: {
          claimOwner: workerId,
          claimedAt: now,
          attempts: {
            increment: 1,
          },
        },
      })

    if (claimed.count === 0) {
      return null
    }

    return prisma.treasuryExecutionQueue.findUnique({
      where: { id: job.id },
    })
  }

  return transitionTreasuryQueue({
    id: job.id,
    to: TREASURY_QUEUE_STATUS.CLAIMED,
    data: {
      claimOwner: workerId,
      claimedAt: now,
      attempts: {
        increment: 1,
      },
    },
  })
}
