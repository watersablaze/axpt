import { NextResponse } from 'next/server'
import {
  validateTransitionRegistry,
} from '@/domains/control-center/validateTransitionRegistry'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      {
        ok: false,
        error: 'Not allowed in production',
      },
      { status: 403 }
    )
  }

  const result =
    validateTransitionRegistry()

  return NextResponse.json({
    ok: true,
    registry: result,
  })
}