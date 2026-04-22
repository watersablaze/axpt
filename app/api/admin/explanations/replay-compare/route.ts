import { NextResponse } from 'next/server'
import { compareReplay } from '@/domains/explainability/compareReplay'
import { prisma } from '@/infrastructure/db/prisma'
import { calculateDivergence } from '@/domains/explainability/calculateDivergence'

export async function POST(req: Request) {
  try {
    const { decisionId } = await req.json()

    if (typeof decisionId !== 'string' || decisionId.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'decisionId is required' },
        { status: 400 }
      )
    }

    const { original, replay, diff } = await compareReplay(decisionId)
    const divergenceScore = calculateDivergence({
      intentChanged: diff.intentChanged,
      addedFactors: diff.addedFactors,
      removedFactors: diff.removedFactors,
    })

    await prisma.replayAudit.create({
      data: {
        decisionId: original.id,
        originalIntent: original.intent,
        replayIntent: replay.intent ?? null,
        intentChanged: diff.intentChanged,
        addedFactors: diff.addedFactors,
        removedFactors: diff.removedFactors,
        divergenceScore,
      },
    })

    return NextResponse.json({
      ok: true,
      data: {
        original,
        replay,
        diff,
        divergenceScore,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'replay comparison failed' },
      { status: 500 }
    )
  }
}
