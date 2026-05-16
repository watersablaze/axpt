import { NextResponse } from 'next/server'
import { recomputeSecurityState } from '@/domains/security/recomputeSecurityState'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { isAdmin as hasAdminAccess } from "@/domains/auth/isAdmin"

export async function POST() {
  try {
    const principal = await getPrincipal()

    if (!principal) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!hasAdminAccess(principal)) {
      return NextResponse.json(
        { ok: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const result = await recomputeSecurityState()

    return NextResponse.json({
      ok: true,
      result,
    })
  } catch (err) {
    console.error('[SECURITY_RECOMPUTE_ROUTE_ERROR]', err)

    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Recompute failed',
      },
      { status: 500 }
    )
  }
}