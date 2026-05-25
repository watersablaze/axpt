import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPrincipal } from '@/domains/auth/getPrincipal'

export async function GET() {
  const principal = await getPrincipal()

  if (!principal) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const actions = await prisma.incidentActionLog.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  })

  type IncidentActionRecord = (typeof actions)[number]

  return NextResponse.json({
    ok: true,
    actions: actions.map((action: IncidentActionRecord) => ({
      id: action.id,
      incidentKey: action.incidentKey,
      action: action.action,
      operatorEmail: action.operatorEmail,
      operatorId: action.operatorId,
      note: action.note,
      createdAt: action.createdAt.toISOString(),
    })),
  })
}