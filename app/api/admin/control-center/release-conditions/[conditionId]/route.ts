import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { prisma } from '@/lib/prisma'

const RELEASE_CONDITION_STATUSES = [
  'PENDING',
  'SATISFIED',
  'WAIVED',
  'BLOCKED',
] as const

type ReleaseConditionStatus =
  typeof RELEASE_CONDITION_STATUSES[number]

type RouteContext = {
  params: Promise<{
    conditionId: string
  }>
}

type ReleaseConditionBody = {
  title?: string | null
  description?: string | null
  trigger?: string | null
  responsibleParty?: string | null
  evidenceRequired?: string | null
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

function normalizeStatus(
  value: string | null | undefined
): ReleaseConditionStatus | null {
  if (!value) return null

  return RELEASE_CONDITION_STATUSES.includes(
    value as ReleaseConditionStatus
  )
    ? value as ReleaseConditionStatus
    : null
}

function buildUpdateData(
  body: ReleaseConditionBody,
  actorEmail: string
) {
  const data: {
    title?: string
    description?: string | null
    trigger?: string | null
    responsibleParty?: string | null
    evidenceRequired?: string | null
    status?: ReleaseConditionStatus
    satisfiedBy?: string | null
    satisfiedAt?: Date | null
    notes?: string | null
  } = {}

  if ('title' in body) {
    const title = normalizeOptionalText(body.title)

    if (!title) {
      throw new Error('MISSING_TITLE')
    }

    data.title = title
  }

  const optionalFields = [
    'description',
    'trigger',
    'responsibleParty',
    'evidenceRequired',
    'notes',
  ] as const

  for (const field of optionalFields) {
    if (field in body) {
      data[field] = normalizeOptionalText(body[field])
    }
  }

  if ('status' in body) {
    const status = normalizeStatus(body.status)

    if (!status) {
      throw new Error('INVALID_RELEASE_CONDITION_STATUS')
    }

    data.status = status

    if (status === 'SATISFIED') {
      data.satisfiedBy = actorEmail
      data.satisfiedAt = new Date()
    } else {
      data.satisfiedBy = null
      data.satisfiedAt = null
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

  if (!principal) return response

  const { conditionId } = await context.params
  const body = (await req.json()) as ReleaseConditionBody

  const existing =
    await prisma.transactionDossierReleaseCondition.findUnique({
      where: { id: conditionId },
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
      { ok: false, error: 'RELEASE_CONDITION_NOT_FOUND' },
      { status: 404 }
    )
  }

  let data: ReturnType<typeof buildUpdateData>

  try {
    data = buildUpdateData(body, principal.email)
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'INVALID_RELEASE_CONDITION_UPDATE',
      },
      { status: 400 }
    )
  }

  const releaseCondition =
    await prisma.transactionDossierReleaseCondition.update({
      where: { id: conditionId },
      data,
    })

  await prisma.transactionDossierEvent.create({
    data: {
      dossierId: existing.dossierId,
      eventType: 'DOSSIER_RELEASE_CONDITION_UPDATED',
      fromState: null,
      toState: null,
      message:
        `${releaseCondition.title} release condition updated.`,
      actor: principal.email,
      metadata: {
        source: 'control-center.release-conditions',
        reference: existing.dossier.reference,
        releaseConditionId: releaseCondition.id,
        status: releaseCondition.status,
        updatedFields: Object.keys(data),
      },
    },
  })

  return NextResponse.json({
    ok: true,
    releaseCondition,
  })
}

export async function DELETE(
  _req: Request,
  context: RouteContext
) {
  const { principal, response } =
    await requireOperatorAccess()

  if (!principal) return response

  const { conditionId } = await context.params

  const existing =
    await prisma.transactionDossierReleaseCondition.findUnique({
      where: { id: conditionId },
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
      { ok: false, error: 'RELEASE_CONDITION_NOT_FOUND' },
      { status: 404 }
    )
  }

  await prisma.transactionDossierReleaseCondition.delete({
    where: { id: conditionId },
  })

  await prisma.transactionDossierEvent.create({
    data: {
      dossierId: existing.dossierId,
      eventType: 'DOSSIER_RELEASE_CONDITION_DELETED',
      fromState: null,
      toState: null,
      message:
        `${existing.title} release condition deleted.`,
      actor: principal.email,
      metadata: {
        source: 'control-center.release-conditions',
        reference: existing.dossier.reference,
        releaseConditionId: existing.id,
        status: existing.status,
      },
    },
  })

  return NextResponse.json({
    ok: true,
    deletedId: existing.id,
  })
}
