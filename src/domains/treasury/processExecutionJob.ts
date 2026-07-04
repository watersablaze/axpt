import { prisma } from "@/infrastructure/db/prisma";
import { executeTreasuryAction } from "./executeTreasuryAction";
import { TREASURY_ACTION_STATUS, TREASURY_QUEUE_STATUS } from "./stateMachine";
import { transitionTreasuryAction } from "./transitionTreasuryAction";
import { transitionTreasuryQueue } from "./transitionTreasuryQueue";

function computeRetryTime(attempts: number) {
  const seconds = Math.min(60, 5 * attempts);

  return new Date(Date.now() + seconds * 1000);
}

export async function processTreasuryExecutionJob(jobId: string) {
  const job = await prisma.treasuryExecutionQueue.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error("Queue job not found");
  }

  /**
   * Prevent accidental execution of unclaimed jobs
   */
  if (job.status !== TREASURY_QUEUE_STATUS.CLAIMED) {
    throw new Error(`Job is not claimed: ${job.status}`);
  }

  try {
    await transitionTreasuryQueue({
      id: job.id,
      to: TREASURY_QUEUE_STATUS.EXECUTING,
    });

    await transitionTreasuryAction({
      id: job.treasuryActionId,
      to: TREASURY_ACTION_STATUS.EXECUTING,
    });

    const result = await executeTreasuryAction(job.treasuryActionId);

    await transitionTreasuryQueue({
      id: job.id,
      to: TREASURY_QUEUE_STATUS.EXECUTED,
      data: {
        lastError: null,
        nextRetryAt: null,
        claimOwner: null,
        claimedAt: null,
        transactionId: result?.transactionId ?? null,
      },
    });

    await transitionTreasuryAction({
      id: job.treasuryActionId,
      to: TREASURY_ACTION_STATUS.EXECUTED,
      data: {
        executedAt: new Date(),
        executionError: null,
      },
    });

    return result;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown execution error";

    await transitionTreasuryQueue({
      id: job.id,
      to: TREASURY_QUEUE_STATUS.FAILED_RETRYABLE,
      data: {
        lastError: message,
        nextRetryAt: computeRetryTime(job.attempts),
        claimOwner: null,
        claimedAt: null,
      },
    });

    await transitionTreasuryAction({
      id: job.treasuryActionId,
      to: TREASURY_ACTION_STATUS.FAILED_RETRYABLE,
      data: {
        executionError: message,
      },
    });

    throw err;
  }
}
