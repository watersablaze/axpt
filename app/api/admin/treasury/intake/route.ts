import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: 'TREASURY_INTAKE_NOT_OPERATIONAL',
    },
    { status: 503 },
  )
}
