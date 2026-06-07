import { prisma } from '@/lib/prisma'
import { EventTypes } from '@/core/events/types'

type Input = {
  dossierId: string
  reference: string
  fromState: string
  toState: string
  operatorEmail: string
}

export async function generateTransitionArtifacts({
  dossierId,
  reference,
  fromState,
  toState,
  operatorEmail,
}: Input) {
  if (
    fromState === 'TREASURY_PENDING' &&
    toState === 'EXPORT_RELEASED'
  ) {
    const existing =
      await prisma.transactionDossierInstrument.findFirst({
        where: {
          dossierId,
          type: 'EXPORT_RELEASE_NOTICE',
          version: 'v1',
        },
      })

    const instrument =
      existing ??
      await prisma.transactionDossierInstrument.create({
        data: {
          dossierId,
          type: 'EXPORT_RELEASE_NOTICE',
          title: 'Export Release Notice',
          status: 'DRAFT',
          version: 'v1',
          notes:
            `Generated from ${fromState} → ${toState} for ${reference} by ${operatorEmail}.`,
        },
      })

    const event =
      await prisma.transactionDossierEvent.create({
        data: {
          dossierId,
          eventType: EventTypes.INSTRUMENT_GENERATED,
          fromState: null,
          toState: null,
          message:
            'Export Release Notice generated from transition execution.',
          actor: operatorEmail,
        },
      })

    return [
      {
        type: 'EXPORT_RELEASE_NOTICE',
        instrument,
        event,
      },
    ]
  }

  return []
}