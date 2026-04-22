import { prisma } from '@/infrastructure/db/prisma'
import { CLAIM_TTL_MS, SUBMITTING_TTL_MS, BATCH_SIZE } from './worker.config'

export type ClaimedMirrorJob = {
  id: string
  walletEventId: string
  idempotencyKey: string
  assetCode: string
  amountBaseUnits: unknown
  fromAddress: string
  toAddress: string
  attemptCount: number
  version: number
}

export async function claimJobs(workerId: string): Promise<ClaimedMirrorJob[]> {
  const now = new Date()
  const claimedStale = new Date(Date.now() - CLAIM_TTL_MS)
  const submittingStale = new Date(Date.now() - SUBMITTING_TTL_MS)

  const jobs = await prisma.chainMirrorJob.findMany({
    where: {
      OR: [
        { status: 'PENDING' },
        { status: 'RETRYABLE', nextRetryAt: { lte: now } },
        {
          status: 'CLAIMED',
          OR: [
            { lastHeartbeatAt: { lt: claimedStale } },
            {
              lastHeartbeatAt: null,
              claimedAt: { lt: claimedStale },
            },
          ],
        },
        {
          status: 'SUBMITTING',
          OR: [
            { lastHeartbeatAt: { lt: submittingStale } },
            {
              lastHeartbeatAt: null,
              submissionStartedAt: { lt: submittingStale },
            },
          ],
        },
      ]
    },
    take: BATCH_SIZE,
    orderBy: { createdAt: 'asc' }
  })

  const claimed: ClaimedMirrorJob[] = []

  for (const job of jobs) {
    const updated = await prisma.chainMirrorJob.updateMany({
      where: {
        id: job.id,
        version: job.version,
        OR: [
          { status: 'PENDING' },
          { status: 'RETRYABLE', nextRetryAt: { lte: now } },
          {
            status: 'CLAIMED',
            OR: [
              { lastHeartbeatAt: { lt: claimedStale } },
              {
                lastHeartbeatAt: null,
                claimedAt: { lt: claimedStale },
              },
            ],
          },
          {
            status: 'SUBMITTING',
            OR: [
              { lastHeartbeatAt: { lt: submittingStale } },
              {
                lastHeartbeatAt: null,
                submissionStartedAt: { lt: submittingStale },
              },
            ],
          },
        ]
      },
      data: {
        status: 'CLAIMED',
        claimOwner: workerId,
        claimedAt: now,
        lastHeartbeatAt: now,
        submissionStartedAt: null,
        version: { increment: 1 },
      }
    })

    if (updated.count === 1) {
      claimed.push({
        id: job.id,
        walletEventId: job.walletEventId,
        idempotencyKey: job.idempotencyKey,
        assetCode: job.assetCode,
        amountBaseUnits: job.amountBaseUnits,
        fromAddress: job.fromAddress,
        toAddress: job.toAddress,
        attemptCount: job.attemptCount,
        version: job.version + 1,
      })
    }
  }

  return claimed
}
