import { NextResponse } from 'next/server'
import { requirePermission } from '@/domains/auth/requirePermission'
import { PERMISSIONS } from '@/domains/auth/permissions'
import { syncChainEvents } from '@/domains/mirror/chainSync'
import { requireSystemHealthy } from '@/domains/system/requireSystemHealthy'

export async function POST() {
  try {
    await requirePermission(PERMISSIONS.TREASURY_SYNC)

    const health = await requireSystemHealthy()
    if (!health.allowed) {
      return NextResponse.json({ ok: false, error: health.reason }, { status: 503 })
    }

    const result = await syncChainEvents()
    return NextResponse.json({ ok: true, data: result })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'sync failed' },
      { status: err.status ?? 500 }
    )
  }
}
