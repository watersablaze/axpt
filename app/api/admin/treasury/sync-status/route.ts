import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'
import { sendAlert } from '@/lib/system/alert'

export async function GET() {
  try {
    const state = await prisma.chainSyncState.findUnique({
      where: { id: 'mirror' },
    })

    const latestEvent = await prisma.chainMirrorEvent.findFirst({
      orderBy: { blockNumber: 'desc' },
      select: {
        blockNumber: true,
        createdAt: true,
        chainId: true,
        network: true,
      },
    })

    const lagSeconds = latestEvent?.createdAt
      ? (Date.now() - new Date(latestEvent.createdAt).getTime()) / 1000
      : null

    if (lagSeconds && lagSeconds > 60) {
      await sendAlert(
        `CHAIN SYNC LAG → ${lagSeconds}s behind`,
        'WARN',
        undefined,
        {
          code: 'CHAIN_SYNC_LAG',
          title: 'Chain sync lag',
          fingerprint: 'CHAIN_SYNC_LAG',
          throttleMs: 300_000,
        }
      )
    }

    return NextResponse.json({
      ok: true,
      data: {
        lastSyncedBlock: state?.lastBlock?.toString() ?? null,
        latestIndexedBlock: latestEvent?.blockNumber?.toString() ?? null,
        latestIndexedAt: latestEvent?.createdAt?.toISOString() ?? null,
        chainId: latestEvent?.chainId ?? 11155111,
        network: latestEvent?.network ?? 'sepolia',
        lagSeconds,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message ?? 'failed to read sync status' },
      { status: 500 }
    )
  }
}
