import { prisma } from '@/infrastructure/db/prisma'
import { decimalToBigInt } from '@/lib/money/baseUnits'
import { getAsset, type AssetCode } from '@/lib/assets/registry'

/* =========================
   TYPES
========================= */

export type AssetReconciliationSnapshot = {
  assetCode: AssetCode
  ledgerSupply: bigint
  mirroredConfirmed: bigint
  pendingMirror: bigint
  deadLetter: bigint
  drift: bigint
  timestamp: Date
}

export type ReconciliationStatus =
  | 'HEALTHY'
  | 'IN_FLIGHT'
  | 'WARNING'
  | 'CRITICAL'

/* =========================
   SINGLE-ASSET ENGINE
========================= */

export async function reconcileAsset(
  assetCode: AssetCode
): Promise<AssetReconciliationSnapshot> {
  getAsset(assetCode)

  // Ledger supply
  const balances = await prisma.balance.findMany({
    where: { assetCode }
  })

  let ledgerSupply = 0n
  for (const balance of balances as Array<{ amountBaseUnits: unknown }>) {
    ledgerSupply += decimalToBigInt(balance.amountBaseUnits as string | number)
  }

  // Confirmed mirror
  const confirmedJobs = await prisma.chainMirrorJob.findMany({
    where: {
      assetCode,
      status: 'CONFIRMED'
    }
  })

  let mirroredConfirmed = 0n
  for (const job of confirmedJobs as Array<{ amountBaseUnits: unknown }>) {
    mirroredConfirmed += decimalToBigInt(job.amountBaseUnits as string | number)
  }

  // Pending mirror
  const pendingJobs = await prisma.chainMirrorJob.findMany({
    where: {
      assetCode,
      status: {
        in: ['PENDING', 'CLAIMED', 'SUBMITTING', 'SUBMITTED', 'RETRYABLE']
      }
    }
  })

  let pendingMirror = 0n
  for (const job of pendingJobs as Array<{ amountBaseUnits: unknown }>) {
    pendingMirror += decimalToBigInt(job.amountBaseUnits as string | number)
  }

  // Dead-letter
  const deadJobs = await prisma.chainMirrorJob.findMany({
    where: {
      assetCode,
      status: 'DEAD_LETTER'
    }
  })

  let deadLetter = 0n
  for (const job of deadJobs as Array<{ amountBaseUnits: unknown }>) {
    deadLetter += decimalToBigInt(job.amountBaseUnits as string | number)
  }

  const drift: bigint = ledgerSupply - (mirroredConfirmed + pendingMirror)

  return {
    assetCode,
    ledgerSupply,
    mirroredConfirmed,
    pendingMirror,
    deadLetter,
    drift,
    timestamp: new Date()
  }
}

/* =========================
   MULTI-ASSET ENGINE
========================= */

export async function reconcileAllAssets(): Promise<
  AssetReconciliationSnapshot[]
> {
  const assetCodes: AssetCode[] = ['AXG', 'NMP', 'USD']

  const results = await Promise.all(
    assetCodes.map((code) => reconcileAsset(code))
  )

  return results
}

/* =========================
   INTERPRETATION LAYER
========================= */

export function classifyReconciliation(
  snapshot: AssetReconciliationSnapshot
): ReconciliationStatus {
  if (snapshot.deadLetter > 0n) {
    return 'CRITICAL'
  }

  if (snapshot.drift !== 0n) {
    return 'WARNING'
  }

  if (snapshot.pendingMirror > 0n) {
    return 'IN_FLIGHT'
  }

  return 'HEALTHY'
}
