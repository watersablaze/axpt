import { prisma } from '@/lib/prisma'

export type OperatorActivitySummary = {
  totalActions: number
  approvalsGranted: number
  transitionsExecuted: number
  artifactsGenerated: number
  incidentsResolved: number
  lastActionAt: string | null
  lastActionLabel: string | null
}

export async function getOperatorActivitySummary(
  operatorEmail: string
): Promise<OperatorActivitySummary> {
  const [
    approvalsGranted,
    transitionsExecuted,
    artifactsGenerated,
    latestAction,
  ] = await Promise.all([
    prisma.transactionDossierEvent.count({
      where: {
        actor: operatorEmail,
        eventType: 'DOSSIER_APPROVAL_GRANTED',
      },
    }),

    prisma.transactionDossierEvent.count({
      where: {
        actor: operatorEmail,
        eventType: 'DOSSIER_STATE_TRANSITIONED',
      },
    }),

    prisma.transactionDossierEvent.count({
      where: {
        actor: operatorEmail,
        eventType: 'INSTRUMENT_GENERATED',
      },
    }),

    prisma.transactionDossierEvent.findFirst({
      where: {
        actor: operatorEmail,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ])

  const totalActions =
    approvalsGranted +
    transitionsExecuted +
    artifactsGenerated

  const lastActionLabel =
    latestAction?.fromState && latestAction.toState
      ? `${latestAction.fromState} → ${latestAction.toState}`
      : latestAction?.message ?? null

  return {
    totalActions,
    approvalsGranted,
    transitionsExecuted,
    artifactsGenerated,
    incidentsResolved: 0,
    lastActionAt:
      latestAction?.createdAt.toISOString() ?? null,
    lastActionLabel,
  }
}
