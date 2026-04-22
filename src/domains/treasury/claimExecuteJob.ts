import { prisma } from '@/infrastructure/db/prisma'

export async function claimTreasuryExecutionJob(workerId: string) {
  const now = new Date()

  const job = await prisma.treasuryExecutionQueue.findFirst({
    where: {
      status: 'PENDING',
      OR: [
        { nextRetryAt: null },
        { nextRetryAt: { lte: now } },
      ],
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  if (!job) return null

  const claimed = await prisma.treasuryExecutionQueue.updateMany({
    where: {
      id: job.id,
      status: 'PENDING',
    },
    data: {
      status: 'CLAIMED',
      claimOwner: workerId,
      claimedAt: now,
      attempts: { increment: 1 },
    },
  })

  if (claimed.count === 0) {
    return null
  }

  return prisma.treasuryExecutionQueue.findUnique({
    where: { id: job.id },
  })
}