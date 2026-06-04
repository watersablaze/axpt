import { prisma } from '@/lib/prisma'
import { appendDomainEvent } from '@/core/events/appendDomainEvent'
import { EventTypes } from '@/core/events/types'

type PrismaTransactionClient = Omit<
  typeof prisma,
  '$connect' |
  '$disconnect' |
  '$on' |
  '$transaction' |
  '$use' |
  '$extends'
>

export type InstrumentStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'EXECUTED'
  | 'ARCHIVED'
  | 'SUPERSEDED'

type UpdateInstrumentStatusInput = {
  instrumentId: string
  status: InstrumentStatus
  operatorEmail: string
  operatorId?: string | null
  note?: string
}

export async function updateInstrumentStatus({
  instrumentId,
  status,
  operatorEmail,
  operatorId = null,
  note,
}: UpdateInstrumentStatusInput) {
  const instrument =
    await prisma.transactionDossierInstrument.findUnique({
      where: {
        id: instrumentId,
      },
      include: {
        dossier: true,
      },
    })

  if (!instrument) {
    throw new Error('INSTRUMENT_NOT_FOUND')
  }

  const previousStatus = instrument.status

  if (previousStatus === status) {
    return {
      instrument,
      changed: false,
    }
  }

  const message =
    note ??
    `${instrument.title} status changed from ${previousStatus} to ${status}.`

  const result = await prisma.$transaction(
  async (tx: PrismaTransactionClient) => {
    const updated =
      await tx.transactionDossierInstrument.update({
        where: {
          id: instrument.id,
        },
        data: {
          status,
        },
      })

    const event =
      await tx.transactionDossierEvent.create({
        data: {
          dossierId: instrument.dossierId,
          eventType: EventTypes.INSTRUMENT_STATUS_CHANGED,
          fromState: null,
          toState: null,
          message,
          actor: operatorEmail,
          metadata: {
            source: 'control-center.instrument-status',
            operatorId,
            operatorEmail,
            instrumentId: instrument.id,
            instrumentType: instrument.type,
            previousStatus,
            status,
          },
        },
      })

    return {
      instrument: updated,
      event,
    }
  })

  await appendDomainEvent({
    streamType: 'DOSSIER',
    streamId: instrument.dossier.reference,
    eventType: EventTypes.INSTRUMENT_STATUS_CHANGED,
    payload: {
      dossierId: instrument.dossierId,
      reference: instrument.dossier.reference,
      instrumentId: instrument.id,
      instrumentType: instrument.type,
      title: instrument.title,
      previousStatus,
      status,
      message,
    },
    metadata: {
      source: 'instrument.status',
      operatorId,
      operatorEmail,
      instrumentId: instrument.id,
      instrumentType: instrument.type,
      dossierId: instrument.dossierId,
      reference: instrument.dossier.reference,
    },
  })

  return {
    instrument: result.instrument,
    event: result.event,
    changed: true,
  }
}