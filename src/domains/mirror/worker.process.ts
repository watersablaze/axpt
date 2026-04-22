import { prisma } from '@/infrastructure/db/prisma'
import { submitMirrorTx } from '@/domains/mirror/adapter.evm'
import {
  HEARTBEAT_INTERVAL_MS,
  MAX_ATTEMPTS,
  computeRetryDelayMs,
} from './worker.config'
import type { ClaimedMirrorJob } from './worker.claim'

export async function processJob(job: ClaimedMirrorJob, workerId: string) {
  const leaseRefreshed = await prisma.chainMirrorJob.updateMany({
    where: {
      id: job.id,
      status: 'CLAIMED',
      claimOwner: workerId,
      version: job.version,
    },
    data: {
      claimedAt: new Date(),
      lastHeartbeatAt: new Date(),
    },
  })

  if (leaseRefreshed.count !== 1) return
  const submittingVersion = job.version + 1
  const submissionStartedAt = new Date()
  const movedToSubmitting = await prisma.chainMirrorJob.updateMany({
    where: {
      id: job.id,
      status: 'CLAIMED',
      claimOwner: workerId,
      version: submittingVersion,
    },
    data: {
      status: 'SUBMITTING',
      submissionStartedAt,
      lastHeartbeatAt: submissionStartedAt,
      version: { increment: 1 },
    },
  })

  if (movedToSubmitting.count !== 1) return

  const ownedJob = {
    id: job.id,
    walletEventId: job.walletEventId,
    idempotencyKey: job.idempotencyKey,
    assetCode: job.assetCode,
    amountBaseUnits: job.amountBaseUnits,
    fromAddress: job.fromAddress,
    toAddress: job.toAddress,
    attemptCount: job.attemptCount,
  }

  const activeVersion = submittingVersion + 1
  const heartbeat = setInterval(() => {
    void prisma.chainMirrorJob.updateMany({
      where: {
        id: job.id,
        status: 'SUBMITTING',
        claimOwner: workerId,
        version: activeVersion,
      },
      data: {
        lastHeartbeatAt: new Date(),
      },
    })
  }, HEARTBEAT_INTERVAL_MS)

  try {
    const txHash = await submitMirrorTx(ownedJob)

    await prisma.chainMirrorJob.updateMany({
      where: {
        id: ownedJob.id,
        status: 'SUBMITTING',
        claimOwner: workerId,
        version: activeVersion,
      },
      data: {
        status: 'SUBMITTED',
        submittedTxHash: txHash,
        submittedAt: new Date(),
        attemptCount: { increment: 1 },
        claimOwner: null,
        claimedAt: null,
        lastHeartbeatAt: null,
        nextRetryAt: null,
        submissionStartedAt: null,
        version: { increment: 1 },
      },
    })

  } catch (err: any) {
    const attempts = ownedJob.attemptCount + 1

    if (attempts >= MAX_ATTEMPTS) {
      await prisma.chainMirrorJob.updateMany({
        where: {
          id: ownedJob.id,
          status: 'SUBMITTING',
          claimOwner: workerId,
          version: activeVersion,
        },
        data: {
          status: 'DEAD_LETTER',
          deadLetteredAt: new Date(),
          lastError: err.message,
          attemptCount: attempts,
          claimOwner: null,
          claimedAt: null,
          lastHeartbeatAt: null,
          submissionStartedAt: null,
          version: { increment: 1 },
        },
      })
    } else {
      await prisma.chainMirrorJob.updateMany({
        where: {
          id: ownedJob.id,
          status: 'SUBMITTING',
          claimOwner: workerId,
          version: activeVersion,
        },
        data: {
          status: 'RETRYABLE',
          nextRetryAt: new Date(Date.now() + computeRetryDelayMs(attempts)),
          lastError: err.message,
          attemptCount: attempts,
          claimOwner: null,
          claimedAt: null,
          lastHeartbeatAt: null,
          submissionStartedAt: null,
          version: { increment: 1 },
        },
      })
    }
  } finally {
    clearInterval(heartbeat)
  }
}
