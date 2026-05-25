import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { getOperationalState } from '@/domains/control-center/getOperationalState'

export async function GET() {
  const principal = await getPrincipal()

  if (!principal) {
    return NextResponse.json(
      { ok: false, error: 'UNAUTHORIZED' },
      { status: 401 }
    )
  }

  const state = await getOperationalState()

  return NextResponse.json({
    ok: true,
    state,
  })
}