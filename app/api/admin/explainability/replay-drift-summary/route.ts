import { NextResponse } from 'next/server'
import { getReplayDriftSummary } from '@/domains/explainability/replayDriftSummary'

export async function GET() {
  try {
    const data = await getReplayDriftSummary()

    return NextResponse.json({
      ok: true,
      data,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'replay drift summary failed' },
      { status: 500 }
    )
  }
}