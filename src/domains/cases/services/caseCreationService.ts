import { prisma } from '@/infrastructure/db/prisma'
import { emitCaseEvent } from '../events/caseEventBus'

type CreateCaseInput = {
  title: string
  jurisdiction?: string
  createdById?: string
}

export async function createCase(input: CreateCaseInput) {

  const caseRecord = await prisma.case.create({
    data: {
      title: input.title,
      jurisdiction: input.jurisdiction,
      status: 'DRAFT'
    }
  })

  await emitCaseEvent({
    name: 'CASE_CREATED',
    payload: {
      caseId: caseRecord.id,
      actorUserId: input.createdById,
      metadata: {
        title: input.title
      }
    },
    occurredAt: new Date().toISOString()
  })

  return caseRecord
}