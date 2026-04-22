import { prisma } from '@/infrastructure/db/prisma'

export async function snapshotSystemState() {
  const [mismatches, deadLetters, latestEvent] = await Promise.all([
    prisma.chainMirrorEvent.count({
      where: { /* optional mismatch flag later */ },
    }),
    prisma.chainMirrorJob.count({
      where: { status: 'DEAD_LETTER' },
    }),
    prisma.chainMirrorEvent.findFirst({
      orderBy: { blockNumber: 'desc' },
    }),
  ])

  // crude sync lag (can refine later)
  const syncLag = latestEvent ? Number(latestEvent.blockNumber) : 0

  return {
    mismatches,
    deadLetters,
    syncLag,
  }
}