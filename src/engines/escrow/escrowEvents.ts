import { prisma } from '@/infrastructure/db/prisma'

export async function emitEscrowEvent(event: {
  escrowId: string
  from: string | null
  to: string
  actor?: string
  metadata?: any
}) {
  await prisma.caseEvent.create({
    data: {
      caseId: event.escrowId,
      type: 'ESCROW_EVENT' as any,
      payload: {
        from: event.from,
        to: event.to,
        actor: event.actor ?? 'SYSTEM',
        metadata: event.metadata ?? {},
      },
    },
  })
}