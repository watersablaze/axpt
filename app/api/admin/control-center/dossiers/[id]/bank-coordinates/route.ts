import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { prisma } from '@/lib/prisma'

const BANK_COORDINATE_ROLES = [
  'BUYER_REMITTING',
  'SELLER_RECEIVING',
  'ESCROW_TRUST',
  'INTERMEDIARY',
  'OTHER',
] as const

type BankCoordinateRole =
  typeof BANK_COORDINATE_ROLES[number]

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type CoordinateBody = {
  role?: string | null
  label?: string | null
  accountName?: string | null
  bankName?: string | null
  bankAddress?: string | null
  accountNumber?: string | null
  routingNumber?: string | null
  swiftCode?: string | null
  iban?: string | null
  currency?: string | null
  country?: string | null
  notes?: string | null
  verificationStatus?: string | null
}

function normalizeOptionalText(
  value: string | null | undefined
) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  return trimmed.length > 0
    ? trimmed
    : null
}

function normalizeRequiredText(
  value: string | null | undefined
) {
  const normalized = normalizeOptionalText(value)

  if (!normalized) {
    return null
  }

  return normalized
}

function normalizeRole(
  value: string | null | undefined
): BankCoordinateRole | null {
  if (!value) return null

  return BANK_COORDINATE_ROLES.includes(
    value as BankCoordinateRole
  )
    ? value as BankCoordinateRole
    : null
}

function normalizeVerificationStatus(
  value: string | null | undefined
) {
  return (
    normalizeOptionalText(value) ??
    'PENDING_REVIEW'
  )
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

  if (!principal) {
    return response
  }

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

  const coordinates =
    await prisma.transactionDossierBankCoordinate.findMany({
      where: {
        dossierId: dossier.id,
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' },
      ],
    })

  return NextResponse.json({
    ok: true,
    dossierId: dossier.id,
    reference: dossier.reference,
    coordinates,
  })
}

export async function POST(
  req: Request,
  context: RouteContext
) {
  const { principal, response } =
    await requireOperatorAccess()

  if (!principal) {
    return response
  }

  const { id } = await context.params
  const body = (await req.json()) as CoordinateBody

  const role = normalizeRole(body.role)
  const label = normalizeRequiredText(body.label)

  if (!role) {
    return NextResponse.json(
      {
        ok: false,
        error: 'INVALID_BANK_COORDINATE_ROLE',
        allowedRoles: BANK_COORDINATE_ROLES,
      },
      { status: 400 }
    )
  }

  if (!label) {
    return NextResponse.json(
      { ok: false, error: 'MISSING_LABEL' },
      { status: 400 }
    )
  }

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

  const coordinate =
    await prisma.transactionDossierBankCoordinate.create({
      data: {
        dossierId: dossier.id,
        role,
        label,
        accountName:
          normalizeOptionalText(body.accountName),
        bankName:
          normalizeOptionalText(body.bankName),
        bankAddress:
          normalizeOptionalText(body.bankAddress),
        accountNumber:
          normalizeOptionalText(body.accountNumber),
        routingNumber:
          normalizeOptionalText(body.routingNumber),
        swiftCode:
          normalizeOptionalText(body.swiftCode),
        iban:
          normalizeOptionalText(body.iban),
        currency:
          normalizeOptionalText(body.currency),
        country:
          normalizeOptionalText(body.country),
        notes:
          normalizeOptionalText(body.notes),
        verificationStatus:
          normalizeVerificationStatus(
            body.verificationStatus
          ),
      },
    })

  await prisma.transactionDossierEvent.create({
    data: {
      dossierId: dossier.id,
      eventType: 'DOSSIER_BANK_COORDINATE_CREATED',
      fromState: null,
      toState: null,
      message:
        `${coordinate.label} bank coordinate created.`,
      actor: principal.email,
      metadata: {
        source: 'control-center.bank-coordinates',
        reference: dossier.reference,
        coordinateId: coordinate.id,
        role: coordinate.role,
        verificationStatus:
          coordinate.verificationStatus,
      },
    },
  })

  return NextResponse.json({
    ok: true,
    dossierId: dossier.id,
    reference: dossier.reference,
    coordinate,
  })
}
