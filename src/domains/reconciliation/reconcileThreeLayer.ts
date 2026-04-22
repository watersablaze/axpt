import { prisma } from '@/infrastructure/db/prisma'
import { decimalToBigInt } from '@/lib/money/baseUnits'
import { type } from 'os'
import { TRANSACTION_TYPES } from '../wallet/constants/transactionTypes'

export type ThreeLayerMismatchType =
  | 'LEDGER_EVENT_MISSING_MIRROR_JOB'
  | 'CONFIRMED_JOB_MISSING_CHAIN_EVENT'
  | 'MIRROR_JOB_MISSING_CHAIN_EVENT'
  | 'AMOUNT_MISMATCH_JOB_CHAIN'
  | 'ASSET_MISMATCH_JOB_CHAIN'
  | 'CHAIN_EVENT_FOR_UNCONFIRMED_JOB'
  | 'CHAIN_EVENT_MISSING_MIRROR_JOB'

export type ThreeLayerStatus = 'HEALTHY' | 'IN_FLIGHT' | 'WARNING' | 'CRITICAL'

export type ThreeLayerMismatch = {
  type: ThreeLayerMismatchType
  assetCode: string
  walletEventId: string
  idempotencyKey?: string
  detail?: Record<string, string>
}

export type AssetThreeLayerSummary = {
  assetCode: string
  ledgerBalanceTotal: bigint
  mirrorJobTotal: bigint
  confirmedMirrorJobTotal: bigint
  chainEventTotal: bigint
  mismatchCount: number
  status: ThreeLayerStatus
}

export type ThreeLayerReconciliationReport = {
  generatedAt: Date
  mismatches: ThreeLayerMismatch[]
  assets: AssetThreeLayerSummary[]
  totals: {
    mismatchCount: number
    assetCount: number
  }
}

type LedgerTransactionRow = {
  id: string
  assetCode: string | null
  amountBaseUnits: unknown
  type: string
}

type MirrorJobRow = {
  walletEventId: string
  idempotencyKey: string
  assetCode: string
  amountBaseUnits: unknown
  status: string
}

type ChainEventRow = {
  idempotencyKey: string
  walletEventId: string
  tokenType: string
  amount: string
}

type BalanceRow = {
  assetCode: string | null
  amountBaseUnits: unknown
}

export async function reconcileThreeLayer(): Promise<ThreeLayerReconciliationReport> {
  const [transactionsRaw, jobsRaw, chainEventsRaw, balancesRaw] = await Promise.all([
    prisma.transaction.findMany({
      where: { assetCode: { not: null } },
      select: {
        id: true,
        assetCode: true,
        amountBaseUnits: true,
        type: true,
      },
    }),
    prisma.chainMirrorJob.findMany({
      select: {
        walletEventId: true,
        idempotencyKey: true,
        assetCode: true,
        amountBaseUnits: true,
        status: true,
      },
    }),
    prisma.chainMirrorEvent.findMany({
      select: {
        idempotencyKey: true,
        walletEventId: true,
        tokenType: true,
        amountBaseUnits: true,
      },
    }),
    prisma.balance.findMany({
      where: { assetCode: { not: null } },
      select: {
        assetCode: true,
        amountBaseUnits: true,
      },
    }),
  ])

  const transactions = transactionsRaw as LedgerTransactionRow[]
  const jobs = jobsRaw as MirrorJobRow[]
  const chainEvents = chainEventsRaw as ChainEventRow[]
  const balances = balancesRaw as BalanceRow[]

  const mismatches: ThreeLayerMismatch[] = []

  const jobsByWalletEventId = new Map(
    jobs.map((job) => [job.walletEventId, job] as const)
  )
  const jobsByIdempotencyKey = new Map(
    jobs.map((job) => [job.idempotencyKey, job] as const)
  )
  const chainByIdempotencyKey = new Map(
    chainEvents.map((event) => [event.idempotencyKey, event] as const)
  )

  for (const tx of transactions) {
    if (!tx.assetCode || tx.type !== type: TRANSACTION_TYPES.DEBIT) continue

    const maybeJob = jobsByWalletEventId.get(tx.id)
    if (!maybeJob) {
      mismatches.push({
        type: 'LEDGER_EVENT_MISSING_MIRROR_JOB',
        assetCode: tx.assetCode,
        walletEventId: tx.id,
      })
    }
  }

  for (const job of jobs) {
    const chainEvent = chainByIdempotencyKey.get(job.idempotencyKey)

    if (!chainEvent) {
      if (job.status === 'CONFIRMED') {
        mismatches.push({
          type: 'CONFIRMED_JOB_MISSING_CHAIN_EVENT',
          assetCode: job.assetCode,
          walletEventId: job.walletEventId,
          idempotencyKey: job.idempotencyKey,
        })
      } else if (
        job.status === 'SUBMITTING' ||
        job.status === 'SUBMITTED'
      ) {
        mismatches.push({
          type: 'MIRROR_JOB_MISSING_CHAIN_EVENT',
          assetCode: job.assetCode,
          walletEventId: job.walletEventId,
          idempotencyKey: job.idempotencyKey,
        })
      }
      continue
    }

    const jobAmount = decimalToBigInt(job.amountBaseUnits as string | number)
    const chainAmount = BigInt(chainEvent.amount)
    const chainAssetCode = chainEvent.tokenType

    if (jobAmount !== chainAmount) {
      mismatches.push({
        type: 'AMOUNT_MISMATCH_JOB_CHAIN',
        assetCode: job.assetCode,
        walletEventId: job.walletEventId,
        idempotencyKey: job.idempotencyKey,
        detail: {
          jobAmount: jobAmount.toString(),
          chainAmount: chainAmount.toString(),
        },
      })
    }

    if (job.assetCode !== chainAssetCode) {
      mismatches.push({
        type: 'ASSET_MISMATCH_JOB_CHAIN',
        assetCode: job.assetCode,
        walletEventId: job.walletEventId,
        idempotencyKey: job.idempotencyKey,
        detail: {
          jobAssetCode: job.assetCode,
          chainTokenType: chainEvent.tokenType,
        },
      })
    }

    if (job.status !== 'CONFIRMED') {
      mismatches.push({
        type: 'CHAIN_EVENT_FOR_UNCONFIRMED_JOB',
        assetCode: job.assetCode,
        walletEventId: job.walletEventId,
        idempotencyKey: job.idempotencyKey,
        detail: {
          jobStatus: job.status,
        },
      })
    }
  }

  for (const chainEvent of chainEvents) {
    const maybeJob = jobsByIdempotencyKey.get(chainEvent.idempotencyKey)
    if (!maybeJob) {
      mismatches.push({
        type: 'CHAIN_EVENT_MISSING_MIRROR_JOB',
        assetCode: chainEvent.tokenType,
        walletEventId: chainEvent.walletEventId,
        idempotencyKey: chainEvent.idempotencyKey,
      })
    }
  }

  const assetCodes = Array.from(
    new Set([
      ...transactions.map((tx) => tx.assetCode).filter(Boolean),
      ...jobs.map((job) => job.assetCode).filter(Boolean),
      ...chainEvents.map((event) => event.tokenType).filter(Boolean),
      ...balances.map((balance) => balance.assetCode).filter(Boolean),
    ])
  ) as string[]

  const assets: AssetThreeLayerSummary[] = assetCodes.map((assetCode) => {
    let ledgerBalanceTotal = 0n
    for (const balance of balances) {
      if (balance.assetCode === assetCode) {
        ledgerBalanceTotal += decimalToBigInt((balance.amountBaseUnits ?? 0) as string | number)
      }
    }

    let mirrorJobTotal = 0n
    let confirmedMirrorJobTotal = 0n
    for (const job of jobs) {
      if (job.assetCode !== assetCode) continue
      const amount = decimalToBigInt(job.amountBaseUnits as string | number)
      mirrorJobTotal += amount
      if (job.status === 'CONFIRMED') {
        confirmedMirrorJobTotal += amount
      }
    }

    let chainEventTotal = 0n
    for (const event of chainEvents) {
      if (event.tokenType === assetCode) {
        chainEventTotal += BigInt(event.amount)
      }
    }

    const mismatchCount = mismatches.filter((mismatch) => mismatch.assetCode === assetCode).length

    let status: ThreeLayerStatus = 'HEALTHY'
    if (mismatchCount > 0) status = 'WARNING'
    if (
      mismatches.some(
        (mismatch) =>
          mismatch.assetCode === assetCode &&
          (
            mismatch.type === 'CONFIRMED_JOB_MISSING_CHAIN_EVENT' ||
            mismatch.type === 'CHAIN_EVENT_MISSING_MIRROR_JOB'
          )
      )
    ) {
      status = 'CRITICAL'
    }
    if (
      status === 'HEALTHY' &&
      jobs.some(
        (job) =>
          job.assetCode === assetCode &&
          ['PENDING', 'CLAIMED', 'SUBMITTING', 'SUBMITTED', 'RETRYABLE'].includes(job.status)
      )
    ) {
      status = 'IN_FLIGHT'
    }

    return {
      assetCode,
      ledgerBalanceTotal,
      mirrorJobTotal,
      confirmedMirrorJobTotal,
      chainEventTotal,
      mismatchCount,
      status,
    }
  })

  const report: ThreeLayerReconciliationReport = {
    generatedAt: new Date(),
    mismatches,
    assets,
    totals: {
      mismatchCount: mismatches.length,
      assetCount: assets.length,
    },
  }

  await prisma.circuitEvent.create({
    data: {
      type: 'RECON',
      severity: mismatches.length > 0 ? 'WARN' : 'INFO',
      message: `Reconciliation run → ${mismatches.length} mismatches`,
    },
  })

  return report
}
