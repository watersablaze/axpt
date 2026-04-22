import { NextResponse } from 'next/server'
import {
  reconcileAllAssets,
  classifyReconciliation
} from '@/domains/reconciliation/reconcileAssets'

function jsonSafe(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_key, current) =>
      typeof current === 'bigint'
        ? current.toString()
        : current instanceof Date
        ? current.toISOString()
        : current
    )
  )
}

export async function GET() {
  try {
    const snapshots = await reconcileAllAssets()

    const enriched = snapshots.map((s) => ({
      ...s,
      status: classifyReconciliation(s)
    }))

    return NextResponse.json({ ok: true, data: jsonSafe(enriched) })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    )
  }
}
