import { prisma } from '@/infrastructure/db/prisma'
import {
  TREASURY_ACTION_STATUS,
  TREASURY_QUEUE_STATUS,
} from './stateMachine'
import { transitionTreasuryAction } from './transitionTreasuryAction'
import { transitionTreasuryQueue } from './transitionTreasuryQueue'

export async function triggerTreasuryExecution(
  actionId: string
) {
  return prisma.$transaction(async (tx) => {
    const action = await tx.treasuryAction.findUnique({
      where: {
        id: actionId,
      },
      select: {
        status: true,
      },
    })

    if (!action) {
      throw new Error('Treasury action missing')
    }

    const existing =
      await tx.treasuryExecutionQueue.findUnique({
        where: {
          treasuryActionId: actionId,
        },
      })

    /**
     * already queued or active
     */
    if (
      existing &&
      [
        TREASURY_QUEUE_STATUS.PENDING,
        TREASURY_QUEUE_STATUS.CLAIMED,
        TREASURY_QUEUE_STATUS.EXECUTING,
        TREASURY_QUEUE_STATUS.EXECUTED,
      ].includes(existing.status as any)
    ) {
      return existing
    }

    /**
     * retry retryable jobs
     */
    if (
      existing &&
      existing.status ===
        TREASURY_QUEUE_STATUS.FAILED_RETRYABLE
    ) {
      if (action.status !== TREASURY_ACTION_STATUS.QUEUED) {
        await transitionTreasuryAction({
          id: actionId,
          to: TREASURY_ACTION_STATUS.QUEUED,
          client: tx,
        })
      }

      return transitionTreasuryQueue({
        id: existing.id,
        to: TREASURY_QUEUE_STATUS.PENDING,
        client: tx,
        data: {
          nextRetryAt: new Date(),
          lastError: null,
          claimOwner: null,
          claimedAt: null,
        },
      })
    }

    if (existing) {
      throw new Error(
        `Queue job cannot be retriggered from status: ${existing.status}`
      )
    }

    if (action.status !== TREASURY_ACTION_STATUS.QUEUED) {
      await transitionTreasuryAction({
        id: actionId,
        to: TREASURY_ACTION_STATUS.QUEUED,
        client: tx,
      })
    }

    return tx.treasuryExecutionQueue.create({
      data: {
        treasuryActionId: actionId,

        status: TREASURY_QUEUE_STATUS.PENDING,

        nextRetryAt: new Date(),

        retryCount: 0,
      },
    })
  })
}
