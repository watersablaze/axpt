import { prisma } from '@/infrastructure/db/prisma'
import { simulateIntent } from '@/domains/simulation/simulateIntent'

export async function replayDecision(decisionId: string) {
  const record = await prisma.decisionExplanation.findUnique({
    where: { id: decisionId },
  })

  if (!record) {
    throw new Error('Decision not found')
  }

  const simulation = await simulateIntent(
    record.intent,
    {
      assetCode: record.assetCode ?? undefined,
      systemState: record.systemState ?? undefined,
    }
  )

  return {
    original: record,
    replay: simulation,
  }
}
