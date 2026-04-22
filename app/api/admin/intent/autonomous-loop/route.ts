import { NextResponse } from 'next/server'
import { requirePermission } from '@/domains/auth/requirePermission'
import { PERMISSIONS } from '@/domains/auth/permissions'
import { runAutonomousLoop } from '@/domains/autonomous/autonomousLoop'
import { requireSystemHealthy } from '@/domains/system/requireSystemHealthy'

export async function POST() {
  try {
    await requirePermission(PERMISSIONS.TREASURY_RUN_AUTONOMOUS_LOOP)

    const health = await requireSystemHealthy()
    if (!health.allowed) {
      return NextResponse.json({ ok: false, error: health.reason }, { status: 503 })
    }

    const result = await runAutonomousLoop()

    return NextResponse.json({
      ok: true,
      data: result,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'autonomous loop failed' },
      { status: err.status ?? 500 }
    )
  }
}
