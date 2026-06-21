import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{
    partyId: string
  }>
}

type PartyBody = {
  legalName?: string | null
  representative?: string | null
  country?: string | null
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

function buildUpdateData(body: PartyBody) {
  const data: {
    legalName?: string
    representative?: string | null
    country?: string | null
    notes?: string | null
  } = {}

  if ('legalName' in body) {
    const legalName = normalizeOptionalText(body.legalName)

    if (!legalName) {
      throw new Error('MISSING_LEGAL_NAME')
    }

    data.legalName = legalName
  }

  if ('representative' in body) {
    data.representative =
      normalizeOptionalText(body.representative)
  }

  if ('country' in body) {
    data.country = normalizeOptionalText(body.country)
  }

  if ('notes' in body) {
    data.notes = normalizeOptionalText(body.notes)
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

  if (!principal) return response

  const { partyId } = await context.params
  const body = (await req.json()) as PartyBody

  const existing =
    await prisma.transactionDossierParty.findUnique({
      where: {
        id: partyId,
      },
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
      { ok: false, error: 'DOSSIER_PARTY_NOT_FOUND' },
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
            : 'INVALID_PARTY_UPDATE',
      },
      { status: 400 }
    )
  }

  const party =
    await prisma.transactionDossierParty.update({
      where: {
        id: partyId,
      },
      data,
    })

  await prisma.transactionDossierEvent.create({
    data: {
      dossierId: existing.dossierId,
      eventType: 'DOSSIER_PARTY_UPDATED',
      fromState: null,
      toState: null,
      message: `${party.role} party record updated.`,
      actor: principal.email,
      metadata: {
        source: 'control-center.parties',
        reference: existing.dossier.reference,
        partyId: party.id,
        role: party.role,
        updatedFields: Object.keys(data),
      },
    },
  })

  return NextResponse.json({
    ok: true,
    party,
  })
}
