import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { PERMISSIONS } from '@/domains/auth/permissions'
import { hasPermission } from '@/domains/auth/hasAuthority'
import { prisma } from '@/infrastructure/db/prisma'
import { resolveGovernorPolicy } from '@/domains/predictive/governorRefinement'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const headers = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Content-Type-Options': 'nosniff',
}

export async function GET() {
  try {
    const principal = await getPrincipal()

    if (!principal) {
      return NextResponse.json(
        { ok: false, error: 'UNAUTHORIZED' },
        { status: 401, headers },
      )
    }

    if (!hasPermission(principal, PERMISSIONS.TREASURY_READ)) {
      return NextResponse.json(
        { ok: false, error: 'FORBIDDEN' },
        { status: 403, headers },
      )
    }

    const governor = await prisma.systemGovernor.findUnique({
      where: { id: 'global' },
    })

    const data = resolveGovernorPolicy({
      governorState: governor?.currentState ?? 'STABLE',
      holdUntil: governor?.holdUntil?.toISOString() ?? null,
    })

    return NextResponse.json(
      { ok: true, data },
      { headers },
    )
  } catch {
    return NextResponse.json(
      { ok: false, error: 'GOVERNOR_POLICY_UNAVAILABLE' },
      { status: 503, headers },
    )
  }
}
