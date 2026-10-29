import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { ok: false, error: 'LEGACY_AUTOMATION_EXECUTION_DISABLED' },
    { status: 503 }
  )
}
