import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: 'ORGANISM_RUNTIME_NOT_AUTHORIZED',
    },
    {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}
