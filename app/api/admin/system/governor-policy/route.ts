import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'
import { resolveGovernorPolicy } from '@/domains/predictive/governorRefinement'

export async function GET() {
  try {
    const governor = await prisma.systemGovernor.findUnique({
      where: { id: 'global' },
    })

    const data = resolveGovernorPolicy({
      governorState: governor?.currentState ?? 'STABLE',
      holdUntil: governor?.holdUntil?.toISOString() ?? null,
    })

    return NextResponse.json({
      ok: true,
      data,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'governor policy failed' },
      { status: 500 }
    )
  }
}