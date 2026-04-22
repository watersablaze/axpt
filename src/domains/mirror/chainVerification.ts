import { prisma } from '@/infrastructure/db/prisma'

type IntegrityMismatch = {
  type: 'MISSING_DB_JOB' | 'AMOUNT_MISMATCH' | 'ASSET_MISMATCH'
  idempotencyKey: string
  walletEventId: string
  assetCode?: string
  detail?: Record<string, string>
}

export async function verifyMirrorIntegrity() {
  // DB-only integrity check:
  // compare the mirrored outbox state against the normalized chain snapshot table.
  const events = await prisma.chainMirrorEvent.findMany({
    select: {
      idempotencyKey: true,
      walletEventId: true,
      tokenType: true,
      amountBaseUnits: true,
    },
  })

  const mismatches: IntegrityMismatch[] = []

  for (const event of events) {
    const job = await prisma.chainMirrorJob.findUnique({
      where: {
        idempotencyKey: event.idempotencyKey
      }
    })

    if (!job) {
      mismatches.push({
        type: 'MISSING_DB_JOB',
        idempotencyKey: event.idempotencyKey,
        walletEventId: event.walletEventId,
        assetCode: event.tokenType,
      })
      continue
    }

    const dbAmount = BigInt(job.amountBaseUnits.toString())
    const chainAmount = BigInt(event.amountBaseUnits)

    if (dbAmount !== chainAmount) {
      mismatches.push({
        type: 'AMOUNT_MISMATCH',
        idempotencyKey: event.idempotencyKey,
        walletEventId: event.walletEventId,
        assetCode: job.assetCode,
        detail: {
          dbAmount: dbAmount.toString(),
          chainAmount: chainAmount.toString(),
        },
      })
    }

    if (job.assetCode !== event.tokenType) {
      mismatches.push({
        type: 'ASSET_MISMATCH',
        idempotencyKey: event.idempotencyKey,
        walletEventId: event.walletEventId,
        assetCode: job.assetCode,
        detail: {
          dbAssetCode: job.assetCode,
          chainTokenType: event.tokenType,
        },
      })
    }
  }

  return {
    totalEvents: events.length,
    mismatches
  }
}
