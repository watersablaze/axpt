import { prisma } from '@/infrastructure/db/prisma'

export async function logExecutionOutcome(params: {
  actionId: string
  transactionId?: string | null
  status: 'SUCCESS' | 'FAILED'
  latencyMs?: number
  error?: string | null
}) {
  const { actionId, transactionId, status, latencyMs, error } = params

  await prisma.treasuryPulseLog.create({
    data: {
      actionId,
      transactionId,
      status,
      latencyMs: latencyMs ?? null,
      error: error ?? null,
    },
  })
}