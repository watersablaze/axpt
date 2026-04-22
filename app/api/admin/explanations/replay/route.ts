import { NextResponse } from 'next/server'
import { replayDecision } from '@/domains/explainability/replayDecision'

export async function POST(req: Request) {
  try {
    const { decisionId } = await req.json()

    const result = await replayDecision(decisionId)

    return NextResponse.json({
      ok: true,
      data: result,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    )
  }
}