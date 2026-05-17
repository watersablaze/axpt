import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      disabled: true,
      message: 'sessionFallback is retired. Use /api/debug/session instead.',
    },
    { status: 410 }
  )
}