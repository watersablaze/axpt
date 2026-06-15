import { prisma } from '@/lib/prisma'

type TransitionLedgerEvent = Awaited<
  ReturnType<
    typeof prisma.transactionDossierEvent.findMany
  >
>[number]

type TransitionLedgerItem = {
  id: string
  dossierId: string
  dossierReference: string
  dossierTitle: string
  eventType: string
  actor: string | null
  fromState: string | null
  toState: string | null
  transitionKey: string | null
  generatedArtifacts: NonNullable<
    TransitionAuditRecord['generatedArtifacts']
  >
  consequences: NonNullable<
    TransitionAuditRecord['consequences']
  >
  approvals: NonNullable<
    TransitionAuditRecord['approvals']
  >
  recordedAt: string
  createdAt: string
}

type TransitionAuditRecord = {
  transition?: {
    fromState?: string
    toState?: string
    transitionKey?: string
  }
  actor?: {
    operatorEmail?: string
  }
  generatedArtifacts?: Array<{
    type?: string
    title?: string
    status?: string
    version?: string
  }>
  consequences?: Array<{
    type?: string
    label?: string
    detail?: string
    severity?: string
  }>
  approvals?: Array<{
    transitionKey?: string
    requiredRole?: string
    requiredCount?: number
    status?: string
  }>
  recordedAt?: string
}

function getTransitionAuditRecord(
  metadata: unknown
): TransitionAuditRecord | null {
  if (
    !metadata ||
    typeof metadata !== 'object' ||
    !('transitionAuditRecord' in metadata)
  ) {
    return null
  }

  const value =
    (metadata as {
      transitionAuditRecord?: unknown
    }).transitionAuditRecord

  if (!value || typeof value !== 'object') {
    return null
  }

  return value as TransitionAuditRecord
}

export async function getTransitionExecutionLedger() {
  const events =
    await prisma.transactionDossierEvent.findMany({
      where: {
        eventType: 'DOSSIER_STATE_TRANSITIONED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      include: {
        dossier: true,
      },
    })

  return events
    .map((event: TransitionLedgerEvent): TransitionLedgerItem | null => {
      const auditRecord =
        getTransitionAuditRecord(event.metadata)

      if (!auditRecord) return null

      return {
        id: event.id,
        dossierId: event.dossierId,
        dossierReference: event.dossier.reference,
        dossierTitle: event.dossier.title,
        eventType: event.eventType,
        actor:
          auditRecord.actor?.operatorEmail ??
          event.actor,
        fromState:
          auditRecord.transition?.fromState ??
          event.fromState,
        toState:
          auditRecord.transition?.toState ??
          event.toState,
        transitionKey:
          auditRecord.transition?.transitionKey ??
          null,
        generatedArtifacts:
          auditRecord.generatedArtifacts ?? [],
        consequences:
          auditRecord.consequences ?? [],
        approvals:
          auditRecord.approvals ?? [],
        recordedAt:
          auditRecord.recordedAt ??
          event.createdAt.toISOString(),
        createdAt:
          event.createdAt.toISOString(),
      }
    })
    .filter(
      (
        item: TransitionLedgerItem | null
      ): item is TransitionLedgerItem =>
        item !== null
    )
}
