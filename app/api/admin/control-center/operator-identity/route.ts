import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'

import {
  getOperatorContext,
} from '@/domains/control-center/getOperatorContext'

import {
  getOperatorActivitySummary,
} from '@/domains/control-center/getOperatorActivitySummary'

export async function GET() {
  const principal = await getPrincipal()

  if (!principal) {
    return NextResponse.json(
      {
        ok: false,
        error: 'UNAUTHORIZED',
      },
      { status: 401 }
    )
  }

  const activity =
    await getOperatorActivitySummary(
      principal.email
    )

  return NextResponse.json({
    ok: true,
    operator: getOperatorContext({
      principal,
      activity,
    }),
  })
}
