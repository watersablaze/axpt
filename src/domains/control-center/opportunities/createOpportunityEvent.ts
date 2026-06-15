import { prisma } from '@/lib/prisma'

import type {
  OpportunityEventType,
} from './types'

type Input = {
  opportunityId: string
  type: OpportunityEventType

  actor?: string | null

  message?: string | null

  metadata?: Record<string, unknown>
}

export async function createOpportunityEvent({
  opportunityId,
  type,
  actor,
  message,
  metadata,
}: Input) {
  return prisma.opportunityEvent.create({
    data: {
      opportunityId,
      type,
      actor: actor ?? null,
      message: message ?? null,
      metadata: metadata ?? undefined,
    },
  })
}