import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'

export async function GET() {
  try {
    const events = await prisma.circuitEvent.findMany({
      where: {
        type: {
          in: ['AUTONOMOUS_DECISION', 'AUTONOMOUS_EXECUTION'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    type EventRow = (typeof events)[number]

    const decisions = events.filter(
      (e: EventRow) => e.type === 'AUTONOMOUS_DECISION'
    )
    const executions = events.filter(
      (e: EventRow) => e.type === 'AUTONOMOUS_EXECUTION'
    )

    return NextResponse.json({
      ok: true,
      data: {
        latestDecision: decisions[0] ?? null,
        latestExecution: executions[0] ?? null,
        decisions,
        executions,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'autonomous summary failed' },
      { status: 500 }
    )
  }
}
