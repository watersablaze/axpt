import { prisma } from '@/infrastructure/db/prisma'

export async function triggerTreasuryExecution(actionId: string) {
  await prisma.treasuryExecutionQueue.upsert({
    where: {
      treasuryActionId: actionId,
    },
    update: {
      status: 'PENDING',
      nextRetryAt: new Date(),
      lastError: null,
    },
    create: {
      treasuryActionId: actionId,
      status: 'PENDING',
      nextRetryAt: new Date(),
    },
  })
}