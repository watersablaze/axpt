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
    id: string
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
): ReleaseConditionStatus {
  if (
    value &&
    RELEASE_CONDITION_STATUSES.includes(
      value as ReleaseConditionStatus
    )
  ) {
    return value as ReleaseConditionStatus
  }

  return 'PENDING'
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

  const releaseConditions =
    await prisma.transactionDossierReleaseCondition.findMany({
      where: {
        dossierId: dossier.id,
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'asc' },
      ],
    })

  return NextResponse.json({
    ok: true,
    dossierId: dossier.id,
    reference: dossier.reference,
    releaseConditions,
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
  const body = (await req.json()) as ReleaseConditionBody

  const title = normalizeOptionalText(body.title)

  if (!title) {
    return NextResponse.json(
      { ok: false, error: 'MISSING_TITLE' },
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

  const status = normalizeStatus(body.status)

  const releaseCondition =
    await prisma.transactionDossierReleaseCondition.create({
      data: {
        dossierId: dossier.id,
        title,
        description:
          normalizeOptionalText(body.description),
        trigger:
          normalizeOptionalText(body.trigger),
        responsibleParty:
          normalizeOptionalText(body.responsibleParty),
        evidenceRequired:
          normalizeOptionalText(body.evidenceRequired),
        status,
        notes:
          normalizeOptionalText(body.notes),
        satisfiedBy:
          status === 'SATISFIED'
            ? principal.email
            : null,
        satisfiedAt:
          status === 'SATISFIED'
            ? new Date()
            : null,
      },
    })

  await prisma.transactionDossierEvent.create({
    data: {
      dossierId: dossier.id,
      eventType: 'DOSSIER_RELEASE_CONDITION_CREATED',
      fromState: null,
      toState: null,
      message:
        `${releaseCondition.title} release condition created.`,
      actor: principal.email,
      metadata: {
        source: 'control-center.release-conditions',
        reference: dossier.reference,
        releaseConditionId: releaseCondition.id,
        status: releaseCondition.status,
      },
    },
  })

  return NextResponse.json({
    ok: true,
    dossierId: dossier.id,
    reference: dossier.reference,
    releaseCondition,
  })
}
