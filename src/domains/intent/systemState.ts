import { prisma } from '@/infrastructure/db/prisma'

export async function readSystemState() {
  const [events, mismatches, deadLetters, syncState] =
    await Promise.all([
      prisma.chainMirrorEvent.findMany({ take: 1 }),
      prisma.circuitEvent.count({
        where: {
          type: 'RECON',
          severity: 'WARN',
        },
      }),
      prisma.chainMirrorJob.count({
        where: { status: 'DEAD_LETTER' },
      }),
      prisma.chainSyncState.findUnique({
        where: { id: 'mirror' },
      }),
    ])

  const syncLagSeconds = syncState
    ? Math.max(
        0,
        Math.floor((Date.now() - syncState.updatedAt.getTime()) / 1000)
      )
    : null

  return {
    hasChainData: events.length > 0,
    isSynced: !!syncState?.lastBlock,
    hasMismatches: mismatches > 0,
    hasDeadLetters: deadLetters > 0,
    mismatchCount: mismatches,
    deadLetterCount: deadLetters,
    syncLagSeconds,
  }
}
