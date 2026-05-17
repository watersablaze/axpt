import { NextResponse } from 'next/server'

import { recomputeSecurityState } from '@/domains/security/recomputeSecurityState'

import { requirePermission } from '@/domains/auth/requirePermission'
import { PERMISSIONS } from '@/domains/auth/permissions'

export async function POST() {
  try {
    await requirePermission(
      PERMISSIONS.SYSTEM_MANAGE_AUTH
    )

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
        error:
          err instanceof Error
            ? err.message
            : 'Recompute failed',
      },
      { status: 500 }
    )
  }
}