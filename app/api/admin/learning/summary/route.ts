import { NextResponse } from 'next/server'
import { getLearningSummary } from '@/domains/learning/learningSummary'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const intent = searchParams.get('intent') ?? 'STABILIZE_SYSTEM'

    const data = await getLearningSummary(intent)

    return NextResponse.json({
      ok: true,
      intent,
      data,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    )
  }
}
