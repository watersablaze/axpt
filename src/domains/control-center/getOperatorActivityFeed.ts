import { prisma } from '@/lib/prisma'

type OperatorActivityEvent = Awaited<
  ReturnType<
    typeof prisma.transactionDossierEvent.findMany
  >
>[number]

export async function getOperatorActivityFeed() {
  const events =
    await prisma.transactionDossierEvent.findMany({
      where: {
        actor: {
          not: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      include: {
        dossier: true,
      },
    })

  return events.map((event: OperatorActivityEvent) => ({
    id: event.id,
    actor: event.actor,
    eventType: event.eventType,
    message: event.message,
    dossierId: event.dossierId,
    dossierReference: event.dossier.reference,
    dossierTitle: event.dossier.title,
    fromState: event.fromState,
    toState: event.toState,
    createdAt: event.createdAt.toISOString(),
    metadata:
      event.metadata as Record<string, unknown> | null,
  }))
}