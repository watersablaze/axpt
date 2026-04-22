import { PrismaClient } from '@prisma/client'
import { createResidentWallet } from '@/domains/wallet/createResidentWallet'
import { creditAxg } from '@/domains/wallet/creditAxg'
import { transferToken } from '@/engines/wallet/service'
import { claimJobs } from '@/domains/mirror/worker.claim'
import { processJob } from '@/domains/mirror/worker.process'
import { confirmJobs } from '@/domains/mirror/worker.confirm'
import { syncChainEvents } from '@/domains/mirror/chainSync'
import { verifyMirrorIntegrity } from '@/domains/mirror/chainVerification'
import { reconcileThreeLayer } from '@/domains/reconciliation/reconcileThreeLayer'
import { formatBaseUnits, parseDisplayToBaseUnits } from '@/lib/money/baseUnits'
import { getAsset } from '@/lib/assets/registry'

const prisma = new PrismaClient()
const AXG = getAsset('AXG')

type Step =
  | 'setup'
  | 'transfer'
  | 'process'
  | 'confirm'
  | 'sync'
  | 'verify'
  | 'reconcile'
  | 'inspect'
  | 'all'

type CliOptions = {
  from: string
  to: string
  amount: string
  seedAmount: string
  idempotencyKey: string
  note: string
  step: Step
  workerId: string
  skipSeed: boolean
}

type ResolvedUser = {
  id: string
  email: string | null
}

function parseArgs(argv: string[]): CliOptions {
  const values: Record<string, string | boolean> = {}

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith('--')) continue

    const key = token.slice(2)
    const next = argv[index + 1]

    if (!next || next.startsWith('--')) {
      values[key] = true
      continue
    }

    values[key] = next
    index += 1
  }

  const idempotencyKey =
    typeof values['idempotency-key'] === 'string'
      ? values['idempotency-key']
      : `smoke-mirror-${new Date().toISOString().replace(/[:.]/g, '-')}`

  const step =
    typeof values.step === 'string'
      ? (values.step as Step)
      : 'all'

  return {
    from: String(values.from ?? ''),
    to: String(values.to ?? ''),
    amount: String(values.amount ?? '1.00'),
    seedAmount: String(values['seed-amount'] ?? '2.00'),
    idempotencyKey,
    note: String(values.note ?? 'runtime smoke fixture'),
    step,
    workerId: String(values['worker-id'] ?? 'smoke-worker'),
    skipSeed: Boolean(values['skip-seed']),
  }
}

function requireOption(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`Missing required option: ${label}`)
  }
}

async function resolveUser(input: string): Promise<ResolvedUser> {
  const where = input.includes('@') ? { email: input } : { id: input }
  const user = await prisma.user.findUnique({
    where,
    select: {
      id: true,
      email: true,
    },
  })

  if (!user) {
    throw new Error(`User not found: ${input}`)
  }

  return user
}

async function getWalletState(userId: string) {
  return prisma.wallet.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      blockchainWallet: {
        select: {
          address: true,
          network: true,
        },
      },
      balances: {
        where: { assetCode: 'AXG' },
        select: {
          id: true,
          amountBaseUnits: true,
        },
      },
    },
  })
}

function printJson(label: string, value: unknown) {
  console.log(`\n=== ${label} ===`)
  console.log(JSON.stringify(value, null, 2))
}

async function ensureWallets(fromUserId: string, toUserId: string) {
  await createResidentWallet(fromUserId)
  await createResidentWallet(toUserId)

  const [fromWallet, toWallet] = await Promise.all([
    getWalletState(fromUserId),
    getWalletState(toUserId),
  ])

  printJson('Wallets', { fromWallet, toWallet })

  if (!fromWallet?.blockchainWallet?.address) {
    throw new Error('Sender wallet is missing blockchainWallet.address')
  }

  if (!toWallet?.blockchainWallet?.address) {
    throw new Error('Recipient wallet is missing blockchainWallet.address')
  }
}

async function maybeSeedSender(fromUserId: string, seedAmount: string) {
  const wallet = await getWalletState(fromUserId)
  const current = wallet?.balances[0]?.amountBaseUnits
    ? BigInt(String(wallet.balances[0].amountBaseUnits))
    : 0n
  const target = parseDisplayToBaseUnits(seedAmount, AXG.decimals)

  if (current >= target) {
    printJson('Seed', {
      skipped: true,
      current: formatBaseUnits(current, AXG.decimals),
      target: seedAmount,
    })
    return
  }

  const needed = target - current
  const result = await creditAxg(
    fromUserId,
    formatBaseUnits(needed, AXG.decimals),
    'runtime smoke seed'
  )

  printJson('Seed', result)
}

async function createFixtureTransfer(
  fromUserId: string,
  toUserId: string,
  options: CliOptions
) {
  const result = await transferToken({
    fromUserId,
    toUserId,
    amount: options.amount,
    assetCode: 'AXG',
    note: options.note,
    idempotencyKey: options.idempotencyKey,
    source: 'smoke',
    feeBps: 0,
    feeMode: 'SENDER_PAYS',
  })

  printJson('Transfer Result', {
    idempotencyKey: options.idempotencyKey,
    result,
  })

  return result
}

async function inspectFixture(idempotencyKey: string) {
  const job = await prisma.chainMirrorJob.findUnique({
    where: { idempotencyKey },
    select: {
      id: true,
      walletEventId: true,
      status: true,
      version: true,
      attemptCount: true,
      claimOwner: true,
      claimedAt: true,
      lastHeartbeatAt: true,
      submissionStartedAt: true,
      submittedTxHash: true,
      submittedAt: true,
      confirmedAt: true,
      failedAt: true,
      deadLetteredAt: true,
      nextRetryAt: true,
      updatedAt: true,
    },
  })

  const [event, transactions] = await Promise.all([
    prisma.chainMirrorEvent.findFirst({
      where: { idempotencyKey },
      select: {
        idempotencyKey: true,
        walletEventId: true,
        tokenType: true,
        amountBaseUnits: true,
        txHash: true,
        blockNumber: true,
        createdAt: true,
      },
    }),
    job?.walletEventId
      ? prisma.transaction.findMany({
          where: {
            OR: [
              { id: job.walletEventId },
              { metadata: { path: ['debitEventId'], equals: job.walletEventId } },
              { metadata: { path: ['baseTransferId'], equals: job.walletEventId } },
            ],
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            assetCode: true,
            amountBaseUnits: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
  ])

  printJson('Fixture Inspection', { job, event, transactions })
  return { job, event, transactions }
}

async function runProcessStep(idempotencyKey: string, workerId: string) {
  const claimedJobs = await claimJobs(workerId)
  const target = claimedJobs.find((job) => job.idempotencyKey === idempotencyKey)

  if (!target) {
    throw new Error(`Fixture job not claimable: ${idempotencyKey}`)
  }

  await processJob(target, workerId)

  printJson('Process Step', {
    workerId,
    claimedJobId: target.id,
    idempotencyKey,
  })
}

async function runConfirmStep() {
  await confirmJobs()
  printJson('Confirm Step', { ok: true })
}

async function runSyncStep() {
  const result = await syncChainEvents()
  printJson('Sync Step', result)
}

async function runVerifyStep() {
  const result = await verifyMirrorIntegrity()
  printJson('Verify Step', result)
}

async function runReconcileStep(idempotencyKey: string) {
  const report = await reconcileThreeLayer()
  const fixtureMismatches = report.mismatches.filter(
    (mismatch) => mismatch.idempotencyKey === idempotencyKey
  )

  printJson('Reconcile Step', {
    totals: report.totals,
    fixtureMismatches,
  })
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  requireOption(options.from, '--from')
  requireOption(options.to, '--to')

  const [fromUser, toUser] = await Promise.all([
    resolveUser(options.from),
    resolveUser(options.to),
  ])

  printJson('Fixture Inputs', {
    fromUser,
    toUser,
    amount: options.amount,
    seedAmount: options.seedAmount,
    idempotencyKey: options.idempotencyKey,
    note: options.note,
    step: options.step,
    workerId: options.workerId,
    skipSeed: options.skipSeed,
  })

  if (options.step === 'setup' || options.step === 'all') {
    await ensureWallets(fromUser.id, toUser.id)
    if (!options.skipSeed) {
      await maybeSeedSender(fromUser.id, options.seedAmount)
    }
  }

  if (options.step === 'transfer' || options.step === 'all') {
    await createFixtureTransfer(fromUser.id, toUser.id, options)
  }

  if (options.step === 'inspect' || options.step === 'all') {
    await inspectFixture(options.idempotencyKey)
  }

  if (options.step === 'process' || options.step === 'all') {
    await runProcessStep(options.idempotencyKey, options.workerId)
    await inspectFixture(options.idempotencyKey)
  }

  if (options.step === 'confirm' || options.step === 'all') {
    await runConfirmStep()
    await inspectFixture(options.idempotencyKey)
  }

  if (options.step === 'sync' || options.step === 'all') {
    await runSyncStep()
    await inspectFixture(options.idempotencyKey)
  }

  if (options.step === 'verify' || options.step === 'all') {
    await runVerifyStep()
  }

  if (options.step === 'reconcile' || options.step === 'all') {
    await runReconcileStep(options.idempotencyKey)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
