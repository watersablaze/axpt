import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: 'LEGACY_DOCUMENT_UPLOAD_DISABLED',
    },
    { status: 503 },
  )
}
