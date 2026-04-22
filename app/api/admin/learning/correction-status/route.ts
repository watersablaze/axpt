import { NextResponse } from 'next/server'
import { getCorrectionStatus } from '@/domains/learning/correctionStatus'

export async function GET() {
  try {
    const data = await getCorrectionStatus()

    return NextResponse.json({
      ok: true,
      data,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'correction status failed' },
      { status: 500 }
    )
  }
}