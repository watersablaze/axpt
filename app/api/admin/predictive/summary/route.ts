import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'
import { canAutoExecute } from '@/domains/autonomous/autonomyPolicy'

export async function GET() {
  try {
    const [events, governor] = await Promise.all([
      prisma.circuitEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
      prisma.systemGovernor.findUnique({
        where: { id: 'global' },
      }),
    ])

    const signals = events.filter((e: any) => e.type === 'PREDICTIVE_SIGNAL')
    const recommendations = events.filter((e: any) => e.type === 'PREDICTIVE_RECOMMENDATION')
    const executions = events.filter((e: any) => e.type === 'PREDICTIVE_EXECUTION')

    // enrich recommendations
    const enriched = recommendations.map((rec: any) => {
      const meta = (rec.metadata ?? {}) as any

      const confidence = meta.confidence ?? 0
      const risks = meta.risks ?? []

      const autoExecutable = canAutoExecute({
        confidence,
        risks,
        systemState: governor?.currentState ?? 'STABLE',
      })

      return {
        ...rec,
        metadata: {
          ...meta,
          autoExecutable,
          governorState: governor?.currentState ?? 'STABLE',
        },
      }
    })

    return NextResponse.json({
      ok: true,
      data: {
        signals,
        recommendations: enriched,
        executions,
        governorState: governor?.currentState ?? 'STABLE',
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    )
  }
}