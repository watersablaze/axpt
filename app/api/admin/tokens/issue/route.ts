import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { ok: false, error: 'LEGACY_TOKEN_ISSUANCE_DISABLED' },
    { status: 503 }
  )
}
