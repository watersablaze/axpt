// src/engines/wallet/chainMirror/worker.ts
import { prisma } from '@/lib/prisma'
import { processJob } from './processor'

const WORKER_ID = `chain-mirror-${process.pid}`
const POLL_INTERVAL_MS = 3000

export async function runChainMirrorWorker() {
  while (true) {
    const job = await prisma.chainMirrorJob.findFirst({
      where: {
        status: 'PENDING',
        OR: [
          { nextAttemptAt: null },
          { nextAttemptAt: { lte: new Date() } }
        ]
      },
      orderBy: { createdAt: 'asc' }
    })

    if (!job) {
      await sleep(POLL_INTERVAL_MS)
      continue
    }

    const claimed = await prisma.chainMirrorJob.updateMany({
      where: {
        id: job.id,
        status: 'PENDING'
      },
      data: {
        status: 'CLAIMED',
        claimedBy: WORKER_ID,
        claimedAt: new Date()
      }
    })

    if (claimed.count === 0) continue

    try {
      await processJob(job.id)
    } catch (err: any) {
      await prisma.chainMirrorJob.update({
        where: { id: job.id },
        data: {
          status: 'RETRY',
          attemptCount: { increment: 1 },
          lastError: err.message,
          nextAttemptAt: new Date(Date.now() + backoff(job.attemptCount))
        }
      })
    }
  }
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms))
}

function backoff(attempt: number) {
  return Math.min(60_000, 2 ** attempt * 1000)
}