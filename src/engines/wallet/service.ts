import { prisma } from '@/infrastructure/db/prisma'
import { getAsset } from '@/lib/assets/registry'
import {
  bigintToDecimal,
  parseDisplayToBaseUnits,
} from '@/lib/money/baseUnits'

import { authoritySpineCompiler } from "@/engines/operator/AuthoritySpineCompiler"
import { etk } from "@/engines/execution/kernel/ExecutionTruthKernel"
import { executionSignalAssembler } from "@/engines/signals/ExecutionSignalAssembler"

import { TRANSACTION_TYPES } from '@/domains/wallet/constants/transactionTypes'
import { authorityLeakageVisualizer } from '../visualizer/AuthorityLeakageVisualizer'

import { WalletError, NotFoundError } from './errors'
import { isUserQuarantined } from '@/domains/security/quarantineState'
import { assertSystemActive } from '@/lib/system/pause'
import { systemModeGuard } from '@/domains/security/systemModeGuard'
import { quarantineGate } from '@/domains/security/quarantineGate'

export async function transferToken(req: any): Promise<any> {

  const {
    fromUserId,
    toUserId,
    amount,
    assetCode,
    idempotencyKey,
    feeBps = 0,
    feeMode = "SENDER_PAYS",
  } = req

  /* ─────────────────────────────
     1. BASIC VALIDATION
  ───────────────────────────── */

  if (!idempotencyKey) {
    throw new WalletError("BAD_REQUEST", "Missing idempotencyKey", 400)
  }

  if (fromUserId === toUserId) {
    throw new WalletError("SELF_TRANSFER_BLOCKED", "Invalid", 400)
  }

  if (await isUserQuarantined(fromUserId)) {
    throw new WalletError("QUARANTINED", "User blocked", 403)
  }

  await assertSystemActive({ assetCode, layer: "TRANSFER" })
  await systemModeGuard()
  await quarantineGate(fromUserId)

  const asset = getAsset(assetCode)

  const amountBaseUnits = parseDisplayToBaseUnits(
    String(amount),
    asset.decimals
  )

  if (amountBaseUnits <= 0n) {
    throw new WalletError("INVALID_AMOUNT", "Invalid amount", 400)
  }

  /* ─────────────────────────────
     2. WALLET RESOLUTION
  ───────────────────────────── */

  const [fromWallet, toWallet] = await Promise.all([
    prisma.wallet.findFirst({ where: { userId: fromUserId } }),
    prisma.wallet.findFirst({ where: { userId: toUserId } }),
  ])

  if (!fromWallet || !toWallet) {
    throw new NotFoundError("Wallet missing")
  }

  /* ─────────────────────────────
     3. FEE MODEL
  ───────────────────────────── */

  const feeBaseUnits =
    (amountBaseUnits * BigInt(feeBps)) / 10_000n

  const senderDebit =
    feeMode === "SENDER_PAYS"
      ? amountBaseUnits + feeBaseUnits
      : amountBaseUnits

  const recipientCredit =
    feeMode === "RECIPIENT_PAYS"
      ? amountBaseUnits - feeBaseUnits
      : amountBaseUnits

  if (recipientCredit <= 0n) {
    throw new WalletError("FEE_ERROR", "Fee exceeds amount", 400)
  }

  /* ─────────────────────────────
     4. SIGNALS → SPINE → ETK
  ───────────────────────────── */

  const signals = await executionSignalAssembler.build(fromUserId, {
    type: "TRANSFER_INTENT",
    timestamp: Date.now(),
    entityId: fromUserId,
    amount: amountBaseUnits,
    wallet: fromWallet.id,
  })

  const spine = authoritySpineCompiler.build(
    signals,
    fromUserId,
    {
      source: "WALLET_TRANSFER",
      toUserId,
      amountBaseUnits,
      assetCode,
    }
  )

  const etkResult = etk.decide(spine)

  authorityLeakageVisualizer.ingest({
    type: "ETK_DECISION",
    entityId: fromUserId,
    traceId: etkResult.trace.traceId,
    timestamp: Date.now(),
    data: etkResult,
  })

  if (etkResult.decision.status !== "ALLOW") {
    throw new WalletError(
      "ETK_BLOCKED",
      etkResult.decision.reason ?? "BLOCKED",
      403
    )
  }

  /* ─────────────────────────────
     5. EXECUTION
  ───────────────────────────── */

  const result = await prisma.$transaction(async (tx) => {

    const [fromBalance, toBalance] = await Promise.all([
      tx.balance.findFirst({
        where: { walletId: fromWallet.id, assetCode },
      }),
      tx.balance.findFirst({
        where: { walletId: toWallet.id, assetCode },
      }),
    ])

    if (!fromBalance) throw new Error("Missing balance")

    const debitTx = await tx.transaction.create({
      data: {
        userId: fromUserId,
        walletId: fromWallet.id,
        type: TRANSACTION_TYPES.DEBIT,
        idempotencyKey,
        amountBaseUnits: bigintToDecimal(senderDebit),
        assetCode,
      },
    })

    const creditTx = await tx.transaction.create({
      data: {
        userId: toUserId,
        walletId: toWallet.id,
        type: TRANSACTION_TYPES.CREDIT,
        journalGroupId: debitTx.id,
        amountBaseUnits: bigintToDecimal(recipientCredit),
        assetCode,
      },
    })

    await tx.balance.update({
      where: { id: fromBalance.id },
      data: {
        amountBaseUnits: {
          decrement: bigintToDecimal(senderDebit),
        },
      },
    })

    await tx.balance.update({
      where: { id: toBalance!.id },
      data: {
        amountBaseUnits: {
          increment: bigintToDecimal(recipientCredit),
        },
      },
    })

    authorityLeakageVisualizer.ingest({
      type: "LEDGER_MUTATION",
      entityId: fromUserId,
      timestamp: Date.now(),
    })

    return {
      transactionId: debitTx.id,
      debitEventId: debitTx.id,
      creditEventId: creditTx.id,
      assetCode,
      fromNextBaseUnits: senderDebit,
      toNextBaseUnits: recipientCredit,
      idempotentReplay: false,
      requestId: crypto.randomUUID(),
    }
  })

  return result
}