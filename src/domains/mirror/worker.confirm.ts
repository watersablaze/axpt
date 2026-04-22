import { prisma } from '@/infrastructure/db/prisma'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { CONFIRMATION_DEPTH } from './worker.config'

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL!)
})

export async function confirmJobs() {
  const jobs = await prisma.chainMirrorJob.findMany({
    where: { status: 'SUBMITTED' },
    take: 20,
    select: {
      id: true,
      version: true,
      submittedTxHash: true,
    },
  })

  const latestBlock = await publicClient.getBlockNumber().catch(() => null)

  for (const job of jobs) {
    if (!job.submittedTxHash) continue

    let receipt: Awaited<
      ReturnType<typeof publicClient.getTransactionReceipt>
    > | null = null

    try {
      receipt = await publicClient.getTransactionReceipt({
        hash: job.submittedTxHash as `0x${string}`
      })
    } catch (err) {
      console.warn('[MirrorWorker] receipt fetch failed', {
        jobId: job.id,
        txHash: job.submittedTxHash,
        error: err instanceof Error ? err.message : String(err),
      })
      continue
    }

    if (!receipt) continue
    if (latestBlock === null) continue

    const confirmations = latestBlock >= receipt.blockNumber
      ? latestBlock - receipt.blockNumber + 1n
      : 0n

    if (confirmations < CONFIRMATION_DEPTH) continue

    if (receipt.status === 'success') {
      await prisma.chainMirrorJob.updateMany({
        where: { id: job.id, status: 'SUBMITTED', version: job.version },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          claimOwner: null,
          claimedAt: null,
          version: { increment: 1 },
        },
      })
    } else {
      await prisma.chainMirrorJob.updateMany({
        where: { id: job.id, status: 'SUBMITTED', version: job.version },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          claimOwner: null,
          claimedAt: null,
          version: { increment: 1 },
        },
      })
    }
  }
}
