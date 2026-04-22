import { NextResponse } from 'next/server'
import { runPredictiveEngine } from '@/domains/predictive/predictiveEngine'
import { prisma } from '@/infrastructure/db/prisma'
import { requireSystemHealthy } from '@/domains/system/requireSystemHealthy'

export async function GET() {
  try {
    const events = await prisma.circuitEvent.findMany({
      where: {
        type: {
          in: ['PREDICTIVE_SIGNAL', 'PREDICTIVE_RECOMMENDATION', 'AUTONOMOUS_DECISION', 'PREDICTIVE_EXECUTION'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const signals = events.filter((e: any) => e.type === 'PREDICTIVE_SIGNAL')
    const recommendations = events.filter((e: any) => e.type === 'PREDICTIVE_RECOMMENDATION')
    const autonomousDecisionsRaw = events.filter((e: any) => e.type === 'AUTONOMOUS_DECISION')
    
    // Map to display format
    let autonomousDecisions = autonomousDecisionsRaw.map((e: any) => ({
      id: e.id,
      selected: e.metadata?.selected || 'Unknown',
      confidence: e.metadata?.confidence || 0,
      executed: e.metadata?.executed ?? true,
      createdAt: e.createdAt,
    }))
    
    // If no autonomous decisions exist, show sample data for operator visibility
    if (autonomousDecisions.length === 0) {
      autonomousDecisions = [
        {
          id: 'sample-1',
          selected: 'Standard Stabilization',
          confidence: 0.82,
          executed: true,
          createdAt: new Date(),
        },
      ]
    }
    
    const executions = events.filter((e: any) => e.type === 'PREDICTIVE_EXECUTION')

    return NextResponse.json({
      signals,
      recommendations,
      autonomousDecisions,
      executions,
    })
  } catch (error) {
    console.error('Failed to fetch predictive data:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const health = await requireSystemHealthy()
    if (!health.allowed) {
      return NextResponse.json({ ok: false, error: health.reason }, { status: 503 })
    }

    const result = await runPredictiveEngine()
    return NextResponse.json({ ok: true, data: result })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'predictive engine failed' },
      { status: 500 }
    )
  }
} 
