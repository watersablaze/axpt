import type { PrismaClient, TransactionClient } from "@prisma/client";

import { TREASURY_ACTION_STATUS, TREASURY_QUEUE_STATUS } from "./stateMachine";

import { transitionTreasuryActionWithClient } from "./transitionTreasuryActionWithClient";

import { transitionTreasuryQueueWithClient } from "./transitionTreasuryQueueWithClient";

const ACTIVE_QUEUE_STATUSES = [
  TREASURY_QUEUE_STATUS.PENDING,
  TREASURY_QUEUE_STATUS.CLAIMED,
  TREASURY_QUEUE_STATUS.EXECUTING,
  TREASURY_QUEUE_STATUS.EXECUTED,
] as const;

export type TreasuryExecutionTriggerClient = PrismaClient | TransactionClient;

export async function triggerTreasuryExecutionWithClient(
  actionId: string,
  client: TreasuryExecutionTriggerClient,
) {
  const action = await client.treasuryAction.findUnique({
    where: {
      id: actionId,
    },

    select: {
      status: true,
    },
  });

  if (!action) {
    throw new Error("[TREASURY_EXECUTION_ACTION_MISSING]");
  }

  const existing = await client.treasuryExecutionQueue.findUnique({
    where: {
      treasuryActionId: actionId,
    },
  });

  if (
    existing &&
    ACTIVE_QUEUE_STATUSES.some((status) => status === existing.status)
  ) {
    return existing;
  }

  if (existing && existing.status === TREASURY_QUEUE_STATUS.FAILED_RETRYABLE) {
    if (
      action.status !== TREASURY_ACTION_STATUS.QUEUED &&
      action.status !== TREASURY_ACTION_STATUS.FAILED_RETRYABLE
    ) {
      throw new Error(
        `[TREASURY_EXECUTION_RETRY_ACTION_STATUS_INVALID] ${action.status}`,
      );
    }

    if (action.status === TREASURY_ACTION_STATUS.FAILED_RETRYABLE) {
      await transitionTreasuryActionWithClient({
        id: actionId,

        to: TREASURY_ACTION_STATUS.QUEUED,

        client,
      });
    }

    return transitionTreasuryQueueWithClient({
      id: existing.id,

      to: TREASURY_QUEUE_STATUS.PENDING,

      client,

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
      `[TREASURY_EXECUTION_QUEUE_RETRIGGER_INVALID] ${existing.status}`,
    );
  }

  if (
    action.status !== TREASURY_ACTION_STATUS.APPROVED &&
    action.status !== TREASURY_ACTION_STATUS.QUEUED
  ) {
    throw new Error(
      `[TREASURY_EXECUTION_ACTION_STATUS_INVALID] ${action.status}`,
    );
  }

  if (action.status === TREASURY_ACTION_STATUS.APPROVED) {
    await transitionTreasuryActionWithClient({
      id: actionId,

      to: TREASURY_ACTION_STATUS.QUEUED,

      client,
    });
  }

  return client.treasuryExecutionQueue.create({
    data: {
      treasuryActionId: actionId,

      status: TREASURY_QUEUE_STATUS.PENDING,

      nextRetryAt: new Date(),

      retryCount: 0,
    },
  });
}
