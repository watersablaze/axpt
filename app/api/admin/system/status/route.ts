import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'
import { detectSystemHealth } from '@/domains/system/detectSystemHealth'

export async function GET() {
  try {
    const [systemState, governor, health] = await Promise.all([
      prisma.systemState.findUnique({
        where: { id: 'global' },
      }),
      prisma.systemGovernor.findUnique({
        where: { id: 'global' },
      }),
      detectSystemHealth(),
    ])

    return NextResponse.json({
      ok: true,
      data: {
        globalPaused: systemState?.globalPaused ?? false,
        pausedAssets: (systemState?.pausedAssets as string[] | null) ?? [],
        pausedLayers: (systemState?.pausedLayers as string[] | null) ?? [],
        reason: systemState?.reason ?? null,

        governorState: governor?.currentState ?? 'STABLE',
        holdUntil: governor?.holdUntil?.toISOString() ?? null,
        lastTransition: governor?.lastTransition?.toISOString() ?? null,

        health,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'status failed' },
      { status: 500 }
    )
  }
}
