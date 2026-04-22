import { prisma } from '@/infrastructure/db/prisma'
import { executeTreasuryAction } from './executeTreasuryAction'

function computeRetryTime(attempts: number) {
  const seconds = Math.min(60, 5 * attempts)
  return new Date(Date.now() + seconds * 1000)
}

export async function processTreasuryExecutionJob(jobId: string) {
  const job = await prisma.treasuryExecutionQueue.findUnique({
    where: { id: jobId },
  })

  if (!job) {
    throw new Error('Queue job not found')
  }

  try {
    await executeTreasuryAction(job.treasuryActionId)

    await prisma.treasuryExecutionQueue.update({
      where: { id: job.id },
      data: {
        status: 'EXECUTED',
        lastError: null,
      },
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown execution error'

    await prisma.treasuryExecutionQueue.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        lastError: message,
        nextRetryAt: computeRetryTime(job.attempts),
      },
    })

    await prisma.treasuryAction.update({
      where: { id: job.treasuryActionId },
      data: {
        status: 'FAILED',
        executionError: message,
      },
    })

    throw err
  }
}