import { prisma } from '@/infrastructure/db/prisma'
import type { WhyExplanation } from './whyEngine'

export async function persistWhy(args: {
  why: WhyExplanation
  scenarioId?: string
  assetCode?: string
  systemState?: string
  metadata?: Record<string, any>
}) {
  const { why, scenarioId, assetCode, systemState, metadata } = args

  await prisma.decisionExplanation.create({
    data: {
      intent: why.intent,
      scenarioId: scenarioId ?? null,
      assetCode: assetCode ?? null,
      systemState: systemState ?? null,
      summary: why.summary,
      factors: why.factors,
      metadata: metadata ?? {},
    },
  })
}