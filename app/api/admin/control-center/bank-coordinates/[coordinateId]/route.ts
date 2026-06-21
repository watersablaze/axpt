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
    coordinateId: string
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

function buildUpdateData(body: CoordinateBody) {
  const data: {
    role?: BankCoordinateRole
    label?: string
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
    verificationStatus?: string
    verifiedBy?: string | null
    verifiedAt?: Date | null
  } = {}

  if ('role' in body) {
    const role = normalizeRole(body.role)

    if (!role) {
      throw new Error('INVALID_BANK_COORDINATE_ROLE')
    }

    data.role = role
  }

  if ('label' in body) {
    const label = normalizeOptionalText(body.label)

    if (!label) {
      throw new Error('MISSING_LABEL')
    }

    data.label = label
  }

  const optionalFields = [
    'accountName',
    'bankName',
    'bankAddress',
    'accountNumber',
    'routingNumber',
    'swiftCode',
    'iban',
    'currency',
    'country',
    'notes',
  ] as const

  for (const field of optionalFields) {
    if (field in body) {
      data[field] =
        normalizeOptionalText(body[field])
    }
  }

  if ('verificationStatus' in body) {
    const verificationStatus =
      normalizeOptionalText(body.verificationStatus) ??
      'PENDING_REVIEW'

    data.verificationStatus = verificationStatus

    if (verificationStatus === 'VERIFIED') {
      data.verifiedAt = new Date()
    } else {
      data.verifiedAt = null
      data.verifiedBy = null
    }
  }

  return data
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

export async function PATCH(
  req: Request,
  context: RouteContext
) {
  const { principal, response } =
    await requireOperatorAccess()

  if (!principal) {
    return response
  }

  const { coordinateId } = await context.params
  const body = (await req.json()) as CoordinateBody

  const existing =
    await prisma.transactionDossierBankCoordinate.findUnique({
      where: { id: coordinateId },
      include: {
        dossier: {
          select: {
            reference: true,
          },
        },
      },
    })

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: 'BANK_COORDINATE_NOT_FOUND' },
      { status: 404 }
    )
  }

  let data: ReturnType<typeof buildUpdateData>

  try {
    data = buildUpdateData(body)
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'INVALID_BANK_COORDINATE_UPDATE',
      },
      { status: 400 }
    )
  }

  if (data.verificationStatus === 'VERIFIED') {
    data.verifiedBy = principal.email
  }

  const coordinate =
    await prisma.transactionDossierBankCoordinate.update({
      where: { id: coordinateId },
      data,
    })

  await prisma.transactionDossierEvent.create({
    data: {
      dossierId: existing.dossierId,
      eventType: 'DOSSIER_BANK_COORDINATE_UPDATED',
      fromState: null,
      toState: null,
      message:
        `${coordinate.label} bank coordinate updated.`,
      actor: principal.email,
      metadata: {
        source: 'control-center.bank-coordinates',
        reference: existing.dossier.reference,
        coordinateId: coordinate.id,
        role: coordinate.role,
        verificationStatus:
          coordinate.verificationStatus,
        updatedFields: Object.keys(data),
      },
    },
  })

  return NextResponse.json({
    ok: true,
    coordinate,
  })
}

export async function DELETE(
  _req: Request,
  context: RouteContext
) {
  const { principal, response } =
    await requireOperatorAccess()

  if (!principal) {
    return response
  }

  const { coordinateId } = await context.params

  const existing =
    await prisma.transactionDossierBankCoordinate.findUnique({
      where: { id: coordinateId },
      include: {
        dossier: {
          select: {
            reference: true,
          },
        },
      },
    })

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: 'BANK_COORDINATE_NOT_FOUND' },
      { status: 404 }
    )
  }

  await prisma.transactionDossierBankCoordinate.delete({
    where: { id: coordinateId },
  })

  await prisma.transactionDossierEvent.create({
    data: {
      dossierId: existing.dossierId,
      eventType: 'DOSSIER_BANK_COORDINATE_DELETED',
      fromState: null,
      toState: null,
      message:
        `${existing.label} bank coordinate deleted.`,
      actor: principal.email,
      metadata: {
        source: 'control-center.bank-coordinates',
        reference: existing.dossier.reference,
        coordinateId: existing.id,
        role: existing.role,
      },
    },
  })

  return NextResponse.json({
    ok: true,
    deletedId: existing.id,
  })
}
