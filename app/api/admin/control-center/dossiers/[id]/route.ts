import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { prisma } from '@/lib/prisma'



type RouteContext = {
  params: Promise<{
    id: string
  }>
}

const DOSSIER_TRANSITION_MAP: Record<string, string[]> = {
  INTAKE_PENDING: ['KYC_REVIEW'],
  KYC_REVIEW: ['SPA_DRAFTING', 'BLOCKED', 'CANCELLED'],
  SPA_DRAFTING: ['SPA_EXECUTED', 'BLOCKED', 'CANCELLED'],
  SPA_EXECUTED: ['ESCROW_PENDING'],
  ESCROW_PENDING: ['ESCROW_FUNDED', 'BLOCKED', 'CANCELLED'],
  ESCROW_FUNDED: ['TREASURY_PENDING'],
  TREASURY_PENDING: ['EXPORT_RELEASED'],
  EXPORT_RELEASED: ['EXPORT_ACTIVE'],
  EXPORT_ACTIVE: ['IN_TRANSIT'],
  IN_TRANSIT: ['REFINERY_INTAKE'],
  REFINERY_INTAKE: ['REFINERY_ASSAY'],
  REFINERY_ASSAY: ['ASSAY_PENDING'],
  ASSAY_PENDING: ['SETTLEMENT_PENDING'],
  SETTLEMENT_PENDING: ['SETTLED'],
  SETTLED: ['CLOSED'],
}

function getNextDossierStates(state: string): string[] {
  return DOSSIER_TRANSITION_MAP[state] ?? []
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const principal = await getPrincipal()

  if (!principal) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const { id } = await context.params

  const dossier =
    await prisma.transactionDossier.findUnique({
      where: { id },
      include: {
        parties: true,
        instruments: true,
        approvalRequirements: {
          include: {
            approvals: true,
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 25,
        },
      },
    })

  if (!dossier) {
    return NextResponse.json(
      { ok: false, error: 'DOSSIER_NOT_FOUND' },
      { status: 404 }
    )
  }

  const nextStates = getNextDossierStates(dossier.state)

  const transitionCount =
    dossier.events.filter(
      (event: (typeof dossier.events)[number]) =>
        event.eventType === 'DOSSIER_STATE_TRANSITIONED'
    ).length

  const executedInstrumentCount =
    dossier.instruments.filter(
      (
        instrument: (typeof dossier.instruments)[number]
      ) => instrument.status === 'EXECUTED'
    ).length

  const pendingApprovalCount =
    dossier.approvalRequirements.filter(
      (
        requirement: (typeof dossier.approvalRequirements)[number]
      ) => requirement.status !== 'SATISFIED'
    ).length

  return NextResponse.json({
    ok: true,
    dossier: {
      id: dossier.id,
      reference: dossier.reference,
      title: dossier.title,
      state: dossier.state,
      commodity: dossier.commodity,
      origin: dossier.origin,
      quantityKg: dossier.quantityKg?.toString() ?? null,
      refinery: dossier.refinery,
      settlement: dossier.settlement,

      nextStates,
      transitionCount,
      executedInstrumentCount,
      pendingApprovalCount,

      parties: dossier.parties,
      instruments: dossier.instruments,
      approvalRequirements:
        dossier.approvalRequirements,
      events: dossier.events.map(
        (event: (typeof dossier.events)[number]) => ({
          ...event,
          createdAt: event.createdAt.toISOString(),
        })
      ),
    },
  })
}
