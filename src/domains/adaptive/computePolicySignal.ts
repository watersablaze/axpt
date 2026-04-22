import { prisma } from '@/infrastructure/db/prisma'

export async function computePolicySignal(userId: string) {
  const recent = await prisma.treasuryPulseLog.findMany({
    where: { },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const failures = recent.filter((row: { status: string }) => row.status === 'FAILED').length
  const success = recent.filter((row: { status: string }) => row.status === 'SUCCESS').length

  const failureRate = failures / Math.max(success + failures, 1)

  return {
    failureRate,
    pressure: recent.length,
  }
}
