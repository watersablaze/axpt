import { NextResponse } from 'next/server'
import { buildScenarios } from '@/domains/scenario/scenarioEngine'

export async function POST(req: Request) {
  try {
    const { intent, context } = await req.json()

    const assetCode =
      Array.isArray(context?.assets) && context.assets.length === 1
        ? context.assets[0]
        : undefined

    const scenarios = await buildScenarios(intent, assetCode)
    const sorted = [...scenarios].sort((a, b) => b.score - a.score)
    const best = sorted[0]

    return NextResponse.json({
      ok: true,
      intent,
      scenarios: sorted,
      best,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'scenario build failed' },
      { status: 500 }
    )
  }
}