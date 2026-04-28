import type { PrismaClient, TransactionClient } from '@prisma/client';
import { prisma } from '@/infrastructure/db/prisma';
import { getAsset, type AssetCode } from '@/lib/assets/registry';
import {
  bigintToDecimal,
  decimalToBigInt,
  formatBaseUnits,
  parseDisplayToBaseUnits,
} from '@/lib/money/baseUnits';
import { createMirrorJob } from '@/domains/mirror/createJob';
import { executeTransaction } from './execute';
import type { TransferRequest, TransferResult } from './types.service';
import { assertWalletPolicy, type WalletRole } from './policy';
import {
  InsufficientFundsError,
  NotFoundError,
  WalletError,
} from './errors';
import { assertSystemActive } from '@/lib/system/pause'
import { findProcessedWalletDebitEvent } from './journal';
import { evaluateTransferPolicy } from '@/domains/wallet/policy/evaluateTransferPolicy'
import { computePolicySignal } from '@/domains/adaptive/computePolicySignal'
import { checkCooldown } from '@/domains/risk/checkCooldown'
import { computeDynamicTransferCapacity } from '@/domains/risk/computeDynamicTransferCapacity'
import { computeRiskScore } from '@/domains/risk/computeRiskScore'
import { learnIntentWeights } from '@/domains/adaptive/learnIntentWeights';
import { getUserTrustScore } from '@/domains/trust/getUserTrustScore'
import { freezeUserIfCriticalRisk } from '@/domains/security/freezeUserIfCriticalRisk'
import { isUserQuarantined } from '@/domains/security/quarantineState'
import { gradualTrustRecovery } from '@/domains/trust/gradualTrustRecovery';
import { persistRiskSnapshot } from '@/domains/security/persistRiskSnapshotBatch'
import { getSystemSecurityState } from '@/domains/security/systemSecurityState'
import { systemModeGuard } from '@/domains/security/systemModeGuard'
import { quarantineGate } from '@/domains/security/quarantineGate'
import { propagateThreatGraph } from '@/domains/security/propagateThreatGraph';
import { clusterContainmentEngine } from '@/domains/security/clusterContainmentEngine'
import {
  getEffectiveZoneThrottle,
  type EffectiveZoneThrottle,
} from '@/domains/security/getEffectiveZoneThrottle';

import { TRANSACTION_TYPES } from '@/domains/wallet/constants/transactionTypes'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

async function lockBalanceRow(
  tx: TransactionClient | PrismaClient,
  balanceId: string
) {
  await tx.$queryRawUnsafe(
    `SELECT id FROM "Balance" WHERE id = $1 FOR UPDATE`,
    balanceId
  );
}

function toLegacyTokenType(assetCode: AssetCode) {
  return assetCode as 'AXG' | 'NMP' | 'USD';
}

function toLegacyFloat(amountBaseUnits: bigint, decimals: number): number {
  return Number(formatBaseUnits(amountBaseUnits, decimals));
}

function computeFeeBaseUnits(amountBaseUnits: bigint, feeBps = 0): bigint {
  const normalizedFeeBps = Math.max(0, Math.floor(feeBps))
  if (normalizedFeeBps <= 0) return 0n
  return (amountBaseUnits * BigInt(normalizedFeeBps)) / 10_000n;
}

async function computeTransferWeight(params: {
  amountBaseUnits: bigint
  decimals: number
  intent?: string
  role?: string
}): Promise<number> {
  const {
    amountBaseUnits,
    decimals,
    intent = 'PEER',
    role = 'USER',
  } = params
  const amount = Number(formatBaseUnits(amountBaseUnits, decimals))

  // Base weight from size
  let weight = 1

  const learned = await learnIntentWeights()

  if (intent && learned[intent]) {
    weight += Math.round(learned[intent] * 2)
  }

  if (amount >= 50) weight += 2
  else if (amount >= 10) weight += 1

  // Intent multiplier
  if (intent === 'TREASURY') weight += 3
  if (intent === 'INVESTMENT') weight += 2
  if (intent === 'REWARD') weight += 1

  // Role adjustment (trusted actors get slightly more room)
  if (role === 'ADMIN_PLATFORM') weight -= 1

  return Math.max(weight, 1)
}

async function computeUserCapacity(params: {
  roles: string[]
  trustScore?: number
  userId: string
}) {
  const { roles, trustScore = 0, userId } = params

  let base = 6

  if (roles.includes('ADMIN_PLATFORM')) base = 20
  else if (roles.includes('TREASURY_OPERATOR')) base = 15
  else if (roles.includes('RESIDENT')) base = 6

  const trustBoost = Math.floor(trustScore / 20)

  const signal = await computePolicySignal(userId)

  if (signal.failureRate > 0.3) {
    base -= 2
  }

  if (signal.failureRate === 0 && signal.pressure > 10) {
    base += 2
  }

  return base + trustBoost
}

function buildTransferResult(args: {
  transactionId: string;
  debitEventId: string;
  creditEventId: string;
  feeEventId?: string | null;
  assetCode: AssetCode;
  decimals: number;
  fromNextBaseUnits: bigint;
  toNextBaseUnits: bigint;
  feeBaseUnits?: bigint;
  requestId: string;
  idempotentReplay: boolean;
}): TransferResult {
  const {
    transactionId,
    debitEventId,
    creditEventId,
    feeEventId,
    assetCode,
    decimals,
    fromNextBaseUnits,
    toNextBaseUnits,
    feeBaseUnits,
    requestId,
    idempotentReplay,
  } = args;

  return {
    transactionId,
    debitEventId,
    creditEventId,
    feeEventId: feeEventId ?? null,
    assetCode,
    fromNext: formatBaseUnits(fromNextBaseUnits, decimals),
    toNext: formatBaseUnits(toNextBaseUnits, decimals),
    feeAmount:
      typeof feeBaseUnits === 'bigint'
        ? formatBaseUnits(feeBaseUnits, decimals)
        : undefined,
    fromNextBaseUnits: fromNextBaseUnits.toString(),
    toNextBaseUnits: toNextBaseUnits.toString(),
    feeBaseUnits:
      typeof feeBaseUnits === 'bigint' ? feeBaseUnits.toString() : undefined,
    idempotentReplay,
    requestId,
  };
}

async function maybeReplayExistingTransfer(
  idempotencyKey: string,
  assetCode: AssetCode,
  decimals: number
): Promise<TransferResult | null> {
  const debitTx = await findProcessedWalletDebitEvent(idempotencyKey);

  if (!debitTx) return null;

  const meta = (debitTx.metadata as Record<string, unknown> | null) ?? {};
  const creditTx = debitTx.journalGroupId
    ? await prisma.transaction.findFirst({
        where: {
          journalGroupId: debitTx.journalGroupId,
          type: TRANSACTION_TYPES.CREDIT,
        },
      })
    : null
  const creditMeta =
    (creditTx?.metadata as Record<string, unknown> | null) ?? {}
  const creditEventId = String(creditTx?.id ?? meta.creditEventId ?? '');
  const feeEventId =
    meta.feeEventId === null || typeof meta.feeEventId === 'undefined'
      ? null
      : String(meta.feeEventId);
  const toNextBaseUnits = BigInt(
    String(
      creditMeta.nextAmountBaseUnits ??
        meta.toNextBaseUnits ??
        '0'
    )
  );
  const feeBaseUnitsRaw = meta.feeBaseUnits;
  const feeBaseUnits =
    typeof feeBaseUnitsRaw === 'undefined' || feeBaseUnitsRaw === null
      ? undefined
      : BigInt(String(feeBaseUnitsRaw));

  return buildTransferResult({
    transactionId: String(meta.transactionId ?? debitTx.id),
    debitEventId: debitTx.id,
    creditEventId,
    feeEventId,
    assetCode,
    decimals,
    fromNextBaseUnits: decimalToBigInt(debitTx.amountBaseUnits ?? 0),
    toNextBaseUnits,
    feeBaseUnits,
    requestId: String(meta.requestId ?? 'replay'),
    idempotentReplay: true,
  });
}

export async function transferToken(
  req: TransferRequest
): Promise<TransferResult> {
  const {
    fromUserId,
    toUserId,
    amount,
    assetCode,
    note,
    metadata,
    idempotencyKey,
    source = 'api',
    feeBps = 0,
    feeMode = 'SENDER_PAYS',
  } = req

  const quarantined = await isUserQuarantined(fromUserId)

  if (quarantined) {
    throw new WalletError(
      'QUARANTINED',
      'Account under review',
      403
    )
  }

  await assertSystemActive({
    assetCode,
    layer: 'TRANSFER',
  })

  await systemModeGuard()
  await quarantineGate(fromUserId)

  const asset = getAsset(assetCode)
  const amountDisplay = String(amount).trim()
  const amountBaseUnits = parseDisplayToBaseUnits(
    amountDisplay,
    asset.decimals
  )

  if (amountBaseUnits <= 0n) {
    throw new WalletError('BAD_REQUEST', 'amount (positive) is required', 400)
  }

  let zoneThrottle: EffectiveZoneThrottle = {
    zoneId: null,
    severity: 'NORMAL',
    feeMultiplier: 1,
    throttleMultiplier: 1,
    cooldownMs: 0,
    rejectTransfers: false,
  }

  try {
    zoneThrottle = await getEffectiveZoneThrottle(fromUserId)
  } catch (err) {
    console.error('[ZONE_THROTTLE_LOOKUP_FAILED]', {
      userId: fromUserId,
      err,
    })
  }

  if (zoneThrottle.rejectTransfers) {
    throw new WalletError(
      'ZONE_RESTRICTED',
      `Transfers blocked due to ${zoneThrottle.severity} containment zone.`,
      403
    )
  }

  if (!idempotencyKey) {
    throw new WalletError('BAD_REQUEST', 'Missing idempotencyKey', 400)
  }

  if (fromUserId === toUserId) {
    throw new WalletError('BAD_REQUEST', 'Cannot transfer to self', 400)
  }

  const requestId = req.requestId ?? crypto.randomUUID()
  const journalGroupId = crypto.randomUUID()
  let riskScore: number | undefined
  let riskLevel: string | undefined

  if (req.context && !req.bypassPolicy) {
    const { principal, intent } = req.context
    const policy = await evaluateTransferPolicy(req.context)

    if (policy.action === 'DENY') {
      let status = 400

      if (
        policy.code === 'FORBIDDEN' ||
        policy.code === 'FORBIDDEN_ACTOR_SCOPE' ||
        policy.code === 'TREASURY_FORBIDDEN' ||
        policy.code === 'INVESTMENT_FORBIDDEN' ||
        policy.code === 'REWARD_FORBIDDEN'
      ) {
        status = 403
      }

      if (policy.code === 'DAILY_LIMIT_EXCEEDED') {
        status = 429
      }

      throw new WalletError(policy.code, policy.reason, status)
    }

    if (policy.action === 'REQUIRE_APPROVAL') {
      riskScore = policy.riskScore
      riskLevel = policy.riskLevel

    let action = await prisma.treasuryAction.findUnique({
      where: {
        idempotencyKey,
      },
    })

    if (!action) {
      action = await prisma.treasuryAction.create({
        data: {
          initiatorUserId: principal.userId,
          fromUserId,
          toUserId,
          idempotencyKey,
          assetCode,
          amountBaseUnits: bigintToDecimal(amountBaseUnits),
          intent,
          approvalType: policy.approvalType,
          status: 'PENDING',
          metadata: {
            note: note ?? null,
            requestId,
            riskScore,
            riskLevel,
          },
        },
      })

      throw new WalletError(
        'TREASURY_ACTION_CREATED',
        `Approval required (${policy.approvalType}). Action ID: ${action.id}`,
        409
      )
    }

    riskScore = policy.riskScore
    riskLevel = policy.riskLevel
  }

  const perfStart = performance.now()

  function logStep(label: string) {
    const elapsed = (performance.now() - perfStart).toFixed(1)
    console.log(`[wallet/transfer] ${label}: ${elapsed}ms`)
  }

  const replay = await maybeReplayExistingTransfer(
    idempotencyKey,
    assetCode,
    asset.decimals
  )

  if (replay) return replay

  const transferMetadata = metadata ?? {}
  const transferIntent =
    typeof transferMetadata.intent === 'string'
      ? transferMetadata.intent
      : req.context?.intent ?? null
  const roles = (req as { roles?: string[] }).roles ?? ['USER']

  const trust = await getUserTrustScore(fromUserId)
  let dynamicFeeBps = feeBps

  if (trust.score > 80) {
    dynamicFeeBps = Math.floor(dynamicFeeBps / 2)
  }

  if (trust.score < 30) {
    dynamicFeeBps = Math.ceil((dynamicFeeBps * 3) / 2)
  }

  dynamicFeeBps = Math.ceil(
    dynamicFeeBps * zoneThrottle.feeMultiplier
  )

  const feeBaseUnits = computeFeeBaseUnits(
    amountBaseUnits,
    dynamicFeeBps
  )

  const role: WalletRole =
    (req as { role?: WalletRole }).role ?? 'USER'
  const currentWeight = await computeTransferWeight({
    amountBaseUnits,
    intent:
      typeof transferMetadata.intent === 'string'
        ? transferMetadata.intent
        : undefined,
    role,
  })

  assertWalletPolicy({
    fromUserId,
    toUserId,
    assetCode,
    amountBaseUnits,
    role,
  })

  const senderDebitBaseUnits =
    feeMode === 'SENDER_PAYS'
      ? amountBaseUnits + feeBaseUnits
      : feeMode === 'SPLIT'
      ? amountBaseUnits + feeBaseUnits / 2n
      : amountBaseUnits

  const recipientCreditBaseUnits =
    feeMode === 'RECIPIENT_PAYS'
      ? amountBaseUnits - feeBaseUnits
      : feeMode === 'SPLIT'
      ? amountBaseUnits - feeBaseUnits / 2n
      : amountBaseUnits

  if (recipientCreditBaseUnits <= 0n) {
    throw new WalletError('BAD_REQUEST', 'Fee too large for amount', 400)
  }

  const [fromWallet, toWallet] = await Promise.all([
    prisma.wallet.findFirst({
      where: { userId: fromUserId },
      select: {
        id: true,
        userId: true,
        blockchainWallet: { select: { address: true } },
      },
    }),
    prisma.wallet.findFirst({
      where: { userId: toUserId },
      select: {
        id: true,
        userId: true,
        blockchainWallet: { select: { address: true } },
      },
    }),
  ])

  if (!fromWallet || !toWallet) {
    throw new NotFoundError(
      'Wallet not found for sender or recipient'
    )
  }

  logStep('wallets fetched')

  try {
    const recentTransfers = await prisma.transaction.findMany({
      where: {
        userId: fromUserId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000),
        },
        type: TRANSACTION_TYPES.DEBIT,
      },
      select: {
        metadata: true,
      },
    })

    const recentWeight = recentTransfers.reduce(
      (
        sum: number,
        tx: { metadata: unknown }
      ) => {
        const meta = tx.metadata as Record<string, unknown> | null
        const w = Number(meta?.weight ?? 1)
        return sum + (isNaN(w) ? 1 : w)
      },
      0
    )

    const riskAssessment = await computeRiskScore({
      userId: fromUserId,
      amountBaseUnits,
      recipientUserId: toUserId,
    })

    const transactionRiskScore = riskAssessment.score

    const baseCapacity = await computeUserCapacity({
      roles,
      trustScore: trust.score,
      userId: fromUserId,
    })

    const dynamicCapacity = computeDynamicTransferCapacity({
      riskScore: transactionRiskScore,
      baseCapacity,
    })

    const system = await getSystemSecurityState()
    const globalMultiplier = system.throttle.multiplier
    const globalCooldown = system.throttle.cooldownMs

    const cooldown = await checkCooldown({
      userId: fromUserId,
      cooldownMs: Math.max(
        dynamicCapacity.cooldownMs,
        globalCooldown,
        zoneThrottle.cooldownMs
      ),
      intent:
        typeof transferMetadata.intent === 'string'
          ? transferMetadata.intent
          : undefined,
    })

    if (cooldown.blocked) {
      throw new WalletError(
        'COOLDOWN_ACTIVE',
        `Transfer cooldown active. Try again in ${Math.ceil((cooldown.remainingMs ?? 0) / 1000)}s`,
        429
      )
    }

    const adjustedWeight = Math.ceil(
      currentWeight *
        dynamicCapacity.throttleMultiplier *
        globalMultiplier *
        zoneThrottle.throttleMultiplier
    )

    const transactionRiskLevel = dynamicCapacity.riskLevel

    riskScore = transactionRiskScore
    riskLevel = transactionRiskLevel

    if (
      recentWeight + adjustedWeight >
      dynamicCapacity.effectiveCapacity
    ) {
      throw new WalletError(
        'RATE_LIMIT',
        `Dynamic transfer limit exceeded (${dynamicCapacity.riskLevel})`,
        429
      )
    }

    const transfer = await prisma.$transaction(
      async (tx: TransactionClient) => {
        await tx.$queryRawUnsafe(
          `SELECT id FROM "User" WHERE id = $1 FOR UPDATE`,
          fromUserId
        )

        const user = await tx.user.findUnique({
          where: { id: fromUserId },
          select: {
            id: true,
            tier: true,
          },
        })

        const [fromBalance, toBalance] = await Promise.all([
          tx.balance.findFirst({
            where: {
              walletId: fromWallet.id,
              assetCode,
            },
          }),
          tx.balance.findFirst({
            where: {
              walletId: toWallet.id,
              assetCode,
            },
          }),
        ])

        if (!fromBalance) {
          throw new Error('Sender balance missing')
        }

        let resolvedToBalance = toBalance

        if (!resolvedToBalance) {
          resolvedToBalance = await tx.balance.create({
            data: {
              walletId: toWallet.id,
              userId: toWallet.userId,
              assetCode,
              tokenType: toLegacyTokenType(assetCode),
              amount: 0,
              amountBaseUnits: bigintToDecimal(0n),
            },
          })

          console.warn(`[TRANSFER] Created missing balance for receiver`)
        }

        logStep('balances fetched')

        await lockBalanceRow(tx, fromBalance.id)
        await lockBalanceRow(tx, resolvedToBalance.id)

        logStep('rows locked')

        const fromLocked = await tx.balance.findUnique({
          where: { id: fromBalance.id },
        })

        const toLocked = await tx.balance.findUnique({
          where: { id: resolvedToBalance.id },
        })

        if (!fromLocked || !toLocked) {
          throw new NotFoundError('Locked balances not found')
        }

        logStep('locked balances re-read')

        const fromLockedBaseUnits = decimalToBigInt(
          fromLocked.amountBaseUnits ?? 0
        )

        const toLockedBaseUnits = decimalToBigInt(
          toLocked.amountBaseUnits ?? 0
        )

        if (fromLockedBaseUnits < senderDebitBaseUnits) {
          throw new InsufficientFundsError()
        }

        const fromNext = executeTransaction(
          {
            assetCode,
            amountBaseUnits: fromLockedBaseUnits,
          },
          {
            assetCode,
            amountBaseUnits: senderDebitBaseUnits,
            direction: type: TRANSACTION_TYPES.DEBIT,
          }
        )

        const toNext = executeTransaction(
          {
            assetCode,
            amountBaseUnits: toLockedBaseUnits,
          },
          {
            assetCode,
            amountBaseUnits: recipientCreditBaseUnits,
            direction: type: TRANSACTION_TYPES.CREDIT',
          }
        )

        const legacyTokenType = toLegacyTokenType(assetCode)

        const debitTx = await tx.transaction.create({
          data: {
            userId: fromUserId,
            walletId: fromWallet.id,
            type: TRANSACTION_TYPES.DEBIT,
            journalGroupId,
            idempotencyKey,
            intent: transferIntent,
            amount: toLegacyFloat(
              senderDebitBaseUnits,
              asset.decimals
            ),
            tokenType: legacyTokenType,
            assetCode,
            amountBaseUnits: bigintToDecimal(
              senderDebitBaseUnits
            ),
            feeBaseUnits: bigintToDecimal(feeBaseUnits),
            metadata: {
              ...transferMetadata,
              riskScore,
              riskLevel,
              zoneId: zoneThrottle.zoneId,
              zoneSeverity: zoneThrottle.severity,
              zoneFeeMultiplier: zoneThrottle.feeMultiplier,
              zoneThrottleMultiplier: zoneThrottle.throttleMultiplier,
              zoneCooldownMs: zoneThrottle.cooldownMs,
              weight: adjustedWeight,
              direction: type: TRANSACTION_TYPES.DEBIT,
              requestId,
              idempotencyKey,
              linkedCreditEventId: null,
              toUserId,
              source,
              note: note ?? null,
              transferAmountBaseUnits:
                amountBaseUnits.toString(),
              feeBaseUnits: feeBaseUnits.toString(),
              feeMode,
              prevAmountBaseUnits:
                fromLockedBaseUnits.toString(),
              nextAmountBaseUnits:
                fromNext.amountBaseUnits.toString(),
            },
          },
        })

        const creditTx = await tx.transaction.create({
          data: {
            userId: toUserId,
            walletId: toWallet.id,
            type: TRANSACTION_TYPES.CREDIT',
            journalGroupId,
            amount: toLegacyFloat(
              recipientCreditBaseUnits,
              asset.decimals
            ),
            tokenType: legacyTokenType,
            assetCode,
            amountBaseUnits: bigintToDecimal(
              recipientCreditBaseUnits
            ),
            feeBaseUnits: bigintToDecimal(feeBaseUnits),
            metadata: {
              ...transferMetadata,
              riskScore,
              riskLevel,
              zoneId: zoneThrottle.zoneId,
              zoneSeverity: zoneThrottle.severity,
              zoneFeeMultiplier: zoneThrottle.feeMultiplier,
              zoneThrottleMultiplier: zoneThrottle.throttleMultiplier,
              zoneCooldownMs: zoneThrottle.cooldownMs,
              weight: adjustedWeight,
              direction: type: TRANSACTION_TYPES.CREDIT',
              requestId,
              linkedDebitEventId: debitTx.id,
              fromUserId,
              source,
              note: note ?? null,
              transferAmountBaseUnits:
                amountBaseUnits.toString(),
              feeBaseUnits: feeBaseUnits.toString(),
              feeMode,
              prevAmountBaseUnits:
                toLockedBaseUnits.toString(),
              nextAmountBaseUnits:
                toNext.amountBaseUnits.toString(),
            },
          },
        })

        logStep('journal entries created')

        await tx.balance.update({
          where: { id: fromLocked.id },
          data: {
            amount: toLegacyFloat(
              fromNext.amountBaseUnits,
              asset.decimals
            ),
            assetCode,
            amountBaseUnits: {
              decrement: bigintToDecimal(senderDebitBaseUnits),
            },
          },
        })

        await tx.balance.update({
          where: { id: resolvedToBalance.id },
          data: {
            amount: toLegacyFloat(
              toNext.amountBaseUnits,
              asset.decimals
            ),
            assetCode,
            amountBaseUnits: {
              increment: bigintToDecimal(
                recipientCreditBaseUnits
              ),
            },
          },
        })

        logStep('balances updated')

        await tx.transaction.update({
          where: { id: debitTx.id },
          data: {
            metadata: {
              ...transferMetadata,
              riskScore,
              riskLevel,
              zoneId: zoneThrottle.zoneId,
              zoneSeverity: zoneThrottle.severity,
              zoneFeeMultiplier: zoneThrottle.feeMultiplier,
              zoneThrottleMultiplier: zoneThrottle.throttleMultiplier,
              zoneCooldownMs: zoneThrottle.cooldownMs,
              weight: adjustedWeight,
              direction: type: TRANSACTION_TYPES.DEBIT,
              requestId,
              transactionId: debitTx.id,
              idempotencyKey,
              toUserId,
              source,
              note: note ?? null,
              transferAmountBaseUnits:
                amountBaseUnits.toString(),
              feeBaseUnits: feeBaseUnits.toString(),
              feeMode,
              creditEventId: creditTx.id,
              toNextBaseUnits:
                toNext.amountBaseUnits.toString(),
              nextAmountBaseUnits:
                fromNext.amountBaseUnits.toString(),
            },
          },
        })

        return {
          result: buildTransferResult({
            transactionId: debitTx.id,
            debitEventId: debitTx.id,
            creditEventId: creditTx.id,
            assetCode,
            decimals: asset.decimals,
            fromNextBaseUnits: fromNext.amountBaseUnits,
            toNextBaseUnits: toNext.amountBaseUnits,
            feeBaseUnits,
            requestId,
            idempotentReplay: false,
          }),
          mirrorJob:
            asset.settlementMode === 'MIRRORED'
              ? {
                  walletEventId: debitTx.id,
                  idempotencyKey,
                  assetCode,
                  amountBaseUnits,
                  fromAddress:
                    fromWallet.blockchainWallet?.address ??
                    ZERO_ADDRESS,
                  toAddress:
                    toWallet.blockchainWallet?.address ??
                    ZERO_ADDRESS,
                }
              : null,
        }
      },
      {
        maxWait: 10_000,
        timeout: 15_000,
      }
    )

    logStep('transaction committed')

    if ((riskScore ?? 0) <= 2) {
      await gradualTrustRecovery({
        userId: fromUserId,
      })
    }

    if (transfer.mirrorJob) {
      try {
        await createMirrorJob(prisma, transfer.mirrorJob)
      } catch (err: unknown) {
        const prismaErr = err as { code?: string }
        if (prismaErr.code !== 'P2002') {
          console.error(
            '[wallet/transfer] mirror job create failed after commit',
            {
              idempotencyKey: transfer.mirrorJob.idempotencyKey,
              walletEventId: transfer.mirrorJob.walletEventId,
              error: err,
            }
          )
          throw err
        }
        console.warn(
          '[wallet/transfer] mirror job already exists',
          transfer.mirrorJob.idempotencyKey
        )
      }

      logStep('mirror job created')
    }

    return transfer.result
  } catch (err: unknown) {
    const replay = await maybeReplayExistingTransfer(
      idempotencyKey,
      assetCode,
      asset.decimals
    )

    if (replay) return replay

    if (err instanceof WalletError) throw err

    const prismaErr = err as {
      code?: string
      message?: string
    }

    if (prismaErr?.code === 'P2002') {
      throw new WalletError(
        'IDEMPOTENCY_CONFLICT',
        'Transfer already processed',
        409
      )
    }

    throw new WalletError(
      'TRANSFER_FAILED',
      prismaErr?.message ?? 'transfer failed',
      400
    )
  }
}
