import { NextResponse } from 'next/server'
import { getAuthDebugState } from '@/domains/auth/debug/getAuthDebugState'

export async function GET() {
  try {
    const data = await getAuthDebugState()

    return NextResponse.json({
      ok: true,
      data,
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? 'auth debug failed',
      },
      { status: 500 }
    )
  }
}