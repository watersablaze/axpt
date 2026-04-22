import { NextResponse } from 'next/server'
import { verifyMirrorIntegrity } from '@/domains/mirror/chainVerification'

function jsonSafe(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_key, current) =>
      typeof current === 'bigint' ? current.toString() : current
    )
  )
}

export async function GET() {
  try {
    const result = await verifyMirrorIntegrity()

    return NextResponse.json({
      ok: true,
      data: jsonSafe(result)
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    )
  }
}
