import { NextResponse } from 'next/server'
import { runAutonomousStrategy } from '@/domains/autonomous/strategyEngine'
import { executeStrategy } from '@/domains/autonomous/strategyExecutor'
import { requireSystemHealthy } from '@/domains/system/requireSystemHealthy'

export async function POST(req: Request) {
  const health = await requireSystemHealthy()
  if (!health.allowed) {
    return NextResponse.json({ ok: false, error: health.reason }, { status: 503 })
  }

  const { intent, assetCode } = await req.json()

  const result = await runAutonomousStrategy(intent, assetCode)

  if (result.allowed) {
    await executeStrategy(intent, result.best, result.confidence, {
      assetCode,
    })
  }

  return NextResponse.json({
    ok: true,
    ...result,
    executed: result.allowed,
  })
}
