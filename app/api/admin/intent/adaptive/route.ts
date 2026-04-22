import { NextResponse } from 'next/server'
import { selectBestIntent } from '@/domains/adaptive/intentSelector'
import { snapshotSystemState } from '@/domains/learning/systemSnapshot'
import { buildIntentWhy } from '@/domains/explainability/whyEngine'

export async function POST() {
  try {
    const state = await snapshotSystemState()

    const intents = await selectBestIntent(state)
    const best = intents[0]
    const why = best
      ? buildIntentWhy({
          intent: best.intent,
          reasoning: best.reasoning,
          systemState: best.systemState,
          assetCode: best.assetCode,
        })
      : null

    return NextResponse.json({
      ok: true,
      state,
      intents,
      best,
      why,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    )
  }
}
