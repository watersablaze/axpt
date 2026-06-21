import { NextResponse } from 'next/server'
import type {
  DossierIssuanceApprovalStatus,
  InstrumentType,
} from '@prisma/client'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { prisma } from '@/lib/prisma'

const ISSUANCE_APPROVAL_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'REVOKED',
] as const

const INSTRUMENT_TYPES = [
  'SPA',
  'ANNEX_A_DELIVERY',
  'ANNEX_B_SETTLEMENT',
  'ANNEX_C_REFINERY',
  'ANNEX_D_COMPLIANCE',
  'ANNEX_E_PROCEDURE',
  'ANNEX_F_FINANCIAL_INSTRUMENT',
  'ANNEX_G_COMPENSATION_SCHEDULE',
  'EXPORT_RELEASE_NOTICE',
] as const

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type ApprovalBody = {
  instrumentType?: string | null
  instrumentId?: string | null
  status?: string | null
  notes?: string | null
}

function normalizeOptionalText(
  value: string | null | undefined
) {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()

  return trimmed.length > 0
    ? trimmed
    : null
}

function normalizeInstrumentType(
  value: string | null | undefined
): InstrumentType | null {
  if (
    value &&
    INSTRUMENT_TYPES.includes(
      value as typeof INSTRUMENT_TYPES[number]
    )
  ) {
    return value as InstrumentType
  }

  return null
}

function normalizeStatus(
  value: string | null | undefined
): DossierIssuanceApprovalStatus {
  if (
    value &&
    ISSUANCE_APPROVAL_STATUSES.includes(
      value as typeof ISSUANCE_APPROVAL_STATUSES[number]
    )
  ) {
    return value as DossierIssuanceApprovalStatus
  }

  return 'PENDING'
}

function statusActorPatch(
  status: DossierIssuanceApprovalStatus,
  actorEmail: string
) {
  if (status === 'APPROVED') {
    return {
      approvedBy: actorEmail,
      approvedAt: new Date(),
      rejectedBy: null,
      rejectedAt: null,
      revokedBy: null,
      revokedAt: null,
    }
  }

  if (status === 'REJECTED') {
    return {
      rejectedBy: actorEmail,
      rejectedAt: new Date(),
      approvedBy: null,
      approvedAt: null,
      revokedBy: null,
      revokedAt: null,
    }
  }

  if (status === 'REVOKED') {
    return {
      revokedBy: actorEmail,
      revokedAt: new Date(),
    }
  }

  return {
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    revokedBy: null,
    revokedAt: null,
  }
}

async function requireOperatorAccess() {
  const principal = await getPrincipal()

  if (!principal) {
    return {
      principal: null,
      response: NextResponse.json(
        { ok: false, error: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    }
  }

  return {
    principal,
    response: null,
  }
}

export async function GET(
  _req: Request,
  context: RouteContext
) {
  const { principal, response } =
    await requireOperatorAccess()

  if (!principal) return response

  const { id } = await context.params

  const dossier =
    await prisma.transactionDossier.findUnique({
      where: { id },
      select: {
        id: true,
        reference: true,
      },
    })

  if (!dossier) {
    return NextResponse.json(
      { ok: false, error: 'DOSSIER_NOT_FOUND' },
      { status: 404 }
    )
  }

  const approvals =
    await prisma.dossierIssuanceApproval.findMany({
      where: {
        dossierId: dossier.id,
      },
      orderBy: [
        { instrumentType: 'asc' },
        { updatedAt: 'desc' },
      ],
    })

  return NextResponse.json({
    ok: true,
    dossierId: dossier.id,
    reference: dossier.reference,
    approvals,
  })
}

export async function POST(
  req: Request,
  context: RouteContext
) {
  const { principal, response } =
    await requireOperatorAccess()

  if (!principal) return response

  const { id } = await context.params
  const body = (await req.json()) as ApprovalBody

  const instrumentType =
    normalizeInstrumentType(body.instrumentType)

  if (!instrumentType) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INVALID_INSTRUMENT_TYPE',
        allowedInstrumentTypes: INSTRUMENT_TYPES,
      },
      { status: 400 }
    )
  }

  const status = normalizeStatus(body.status)
  const notes = normalizeOptionalText(body.notes)
  const instrumentId =
    normalizeOptionalText(body.instrumentId)

  const dossier =
    await prisma.transactionDossier.findUnique({
      where: { id },
      select: {
        id: true,
        reference: true,
      },
    })

  if (!dossier) {
    return NextResponse.json(
      { ok: false, error: 'DOSSIER_NOT_FOUND' },
      { status: 404 }
    )
  }

  const actorPatch =
    statusActorPatch(status, principal.email)

  const approval =
    await prisma.dossierIssuanceApproval.upsert({
      where: {
        dossierId_instrumentType: {
          dossierId: dossier.id,
          instrumentType,
        },
      },
      create: {
        dossierId: dossier.id,
        instrumentType,
        instrumentId,
        status,
        requestedBy: principal.email,
        notes,
        ...actorPatch,
      },
      update: {
        instrumentId,
        status,
        notes,
        ...actorPatch,
      },
    })

  await prisma.transactionDossierEvent.create({
    data: {
      dossierId: dossier.id,
      eventType: 'DOSSIER_ISSUANCE_APPROVAL_UPDATED',
      fromState: null,
      toState: null,
      message:
        `${instrumentType} issuance approval set to ${status}.`,
      actor: principal.email,
      metadata: {
        source: 'control-center.issuance-approval',
        reference: dossier.reference,
        approvalId: approval.id,
        instrumentType,
        instrumentId,
        status,
      },
    },
  })

  return NextResponse.json({
    ok: true,
    dossierId: dossier.id,
    reference: dossier.reference,
    approval,
  })
}
