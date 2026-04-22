import { prisma } from '@/infrastructure/db/prisma'
import { submitMirrorTx } from './adapter.evm'

export async function processJob(jobId: string) {
  const job = await prisma.chainMirrorJob.findUniqueOrThrow({
    where: { id: jobId }
  })

  const tx = await submitMirrorTx(job)

  await prisma.chainMirrorJob.update({
    where: { id: jobId },
    data: {
      status: 'SUBMITTED',
      submittedTxHash: tx,
      submittedAt: new Date()
    }
  })
}
