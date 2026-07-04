import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { TREASURY_ACTION_STATUS, TREASURY_QUEUE_STATUS } from "./stateMachine";

import { transitionTreasuryAction } from "./transitionTreasuryAction";

import { transitionTreasuryQueue } from "./transitionTreasuryQueue";

const ACTIVE_QUEUE_STATUSES = [
  TREASURY_QUEUE_STATUS.PENDING,
  TREASURY_QUEUE_STATUS.CLAIMED,
  TREASURY_QUEUE_STATUS.EXECUTING,
  TREASURY_QUEUE_STATUS.EXECUTED,
] as const;

export async function triggerTreasuryExecution(actionId: string) {
  return prisma.$transaction(async (tx: TransactionClient) => {
    const action = await tx.treasuryAction.findUnique({
      where: {
        id: actionId,
      },

      select: {
        status: true,
      },
    });

    if (!action) {
      throw new Error("Treasury action missing");
    }

    const existing = await tx.treasuryExecutionQueue.findUnique({
      where: {
        treasuryActionId: actionId,
      },
    });

    /**
     * Already queued, active, or completed.
     *
     * Triggering the same action again must not
     * create a duplicate queue job.
     */
    if (
      existing &&
      ACTIVE_QUEUE_STATUSES.some((status) => status === existing.status)
    ) {
      return existing;
    }

    /**
     * Retry a retryable job.
     */
    if (
      existing &&
      existing.status === TREASURY_QUEUE_STATUS.FAILED_RETRYABLE
    ) {
      if (action.status !== TREASURY_ACTION_STATUS.QUEUED) {
        await transitionTreasuryAction({
          id: actionId,

          to: TREASURY_ACTION_STATUS.QUEUED,

          client: tx,
        });
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
      });
    }

    if (existing) {
      throw new Error(
        `Queue job cannot be retriggered from status: ${existing.status}`,
      );
    }

    if (action.status !== TREASURY_ACTION_STATUS.QUEUED) {
      await transitionTreasuryAction({
        id: actionId,

        to: TREASURY_ACTION_STATUS.QUEUED,

        client: tx,
      });
    }

    return tx.treasuryExecutionQueue.create({
      data: {
        treasuryActionId: actionId,

        status: TREASURY_QUEUE_STATUS.PENDING,

        nextRetryAt: new Date(),

        retryCount: 0,
      },
    });
  });
}
