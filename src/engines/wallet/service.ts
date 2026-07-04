import { prisma } from "@/infrastructure/db/prisma";
import { getAsset } from "@/lib/assets/registry";
import {
  bigintToDecimal,
  formatBaseUnits,
  parseDisplayToBaseUnits,
} from "@/lib/money/baseUnits";

import { authoritySpineCompiler } from "@/engines/operator/AuthoritySpineCompiler";
import { etk } from "@/engines/execution/kernel/ExecutionTruthKernel";
import { executionSignalAssembler } from "@/engines/signals/ExecutionSignalAssembler";

import { TRANSACTION_TYPES } from "@/domains/wallet/constants/transactionTypes";
import { authorityLeakageVisualizer } from "../visualizer/AuthorityLeakageVisualizer";

import { WalletError, NotFoundError } from "./errors";
import { findProcessedWalletTransfer } from "./journal";
import { isUserQuarantined } from "@/domains/security/quarantineState";
import { assertSystemActive } from "@/lib/system/pause";
import { systemModeGuard } from "@/domains/security/systemModeGuard";
import { quarantineGate } from "@/domains/security/quarantineGate";

type WalletTransferReplayExpectation = {
  idempotencyKey: string;
  fromUserId: string;
  toUserId: string;
  fromWalletId: string;
  toWalletId: string;
  assetCode: string;
  senderDebit: bigint;
  recipientCredit: bigint;
};

function readMetadataString(metadata: unknown, key: string): string | null {
  if (
    typeof metadata !== "object" ||
    metadata === null ||
    Array.isArray(metadata)
  ) {
    return null;
  }

  const value = (metadata as Record<string, unknown>)[key];

  return typeof value === "string" ? value : null;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function recoverProcessedWalletTransfer(
  expected: WalletTransferReplayExpectation,
) {
  const processed = await findProcessedWalletTransfer(expected.idempotencyKey);

  if (!processed) {
    return null;
  }

  const { debit, credit } = processed;

  const identityMatches =
    debit.userId === expected.fromUserId &&
    debit.walletId === expected.fromWalletId &&
    debit.assetCode === expected.assetCode &&
    debit.amountBaseUnits?.toString() === expected.senderDebit.toString() &&
    credit.userId === expected.toUserId &&
    credit.walletId === expected.toWalletId &&
    credit.assetCode === expected.assetCode &&
    credit.amountBaseUnits?.toString() === expected.recipientCredit.toString();

  if (!identityMatches) {
    throw new WalletError(
      "IDEMPOTENCY_CONFLICT",
      "Idempotency key already belongs to another transfer",
      409,
    );
  }

  const fromNextBaseUnits = readMetadataString(
    debit.metadata,
    "fromNextBaseUnits",
  );

  const toNextBaseUnits = readMetadataString(debit.metadata, "toNextBaseUnits");

  if (!fromNextBaseUnits || !toNextBaseUnits) {
    throw new Error("WALLET_REPLAY_EVIDENCE_INCOMPLETE");
  }

  return {
    transactionId: debit.id,
    debitEventId: debit.id,
    creditEventId: credit.id,
    assetCode: expected.assetCode,
    fromNextBaseUnits,
    toNextBaseUnits,
    idempotentReplay: true,
    requestId:
      readMetadataString(debit.metadata, "requestId") ?? crypto.randomUUID(),
  };
}

export async function transferToken(req: any): Promise<any> {
  const {
    fromUserId,
    toUserId,
    amount,
    assetCode,
    idempotencyKey,
    feeBps = 0,
    feeMode = "SENDER_PAYS",
  } = req;

  /* ─────────────────────────────
     1. BASIC VALIDATION
  ───────────────────────────── */

  if (!idempotencyKey) {
    throw new WalletError("BAD_REQUEST", "Missing idempotencyKey", 400);
  }

  if (fromUserId === toUserId) {
    throw new WalletError("SELF_TRANSFER_BLOCKED", "Invalid", 400);
  }

  if (await isUserQuarantined(fromUserId)) {
    throw new WalletError("QUARANTINED", "User blocked", 403);
  }

  await assertSystemActive({ assetCode, layer: "TRANSFER" });
  await systemModeGuard();
  await quarantineGate(fromUserId);

  const asset = getAsset(assetCode);

  const amountBaseUnits = parseDisplayToBaseUnits(
    String(amount),
    asset.decimals,
  );

  if (amountBaseUnits <= 0n) {
    throw new WalletError("INVALID_AMOUNT", "Invalid amount", 400);
  }

  /* ─────────────────────────────
     2. WALLET RESOLUTION
  ───────────────────────────── */

  const [fromWallet, toWallet] = await Promise.all([
    prisma.wallet.findFirst({ where: { userId: fromUserId } }),
    prisma.wallet.findFirst({ where: { userId: toUserId } }),
  ]);

  if (!fromWallet || !toWallet) {
    throw new NotFoundError("Wallet missing");
  }

  /* ─────────────────────────────
     3. FEE MODEL
  ───────────────────────────── */

  const feeBaseUnits = (amountBaseUnits * BigInt(feeBps)) / 10_000n;

  const senderDebit =
    feeMode === "SENDER_PAYS"
      ? amountBaseUnits + feeBaseUnits
      : amountBaseUnits;

  const recipientCredit =
    feeMode === "RECIPIENT_PAYS"
      ? amountBaseUnits - feeBaseUnits
      : amountBaseUnits;

  if (recipientCredit <= 0n) {
    throw new WalletError("FEE_ERROR", "Fee exceeds amount", 400);
  }

  const replayExpectation = {
    idempotencyKey,
    fromUserId,
    toUserId,
    fromWalletId: fromWallet.id,
    toWalletId: toWallet.id,
    assetCode,
    senderDebit,
    recipientCredit,
  };

  const existingReplay =
    await recoverProcessedWalletTransfer(replayExpectation);

  if (existingReplay) {
    return existingReplay;
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
  });

  const spine = authoritySpineCompiler.build(signals, fromUserId, {
    source: "WALLET_TRANSFER",
    toUserId,
    amountBaseUnits,
    assetCode,
  });

  const etkResult = etk.decide(spine);

  authorityLeakageVisualizer.ingest({
    type: "ETK_DECISION",
    entityId: fromUserId,
    traceId: etkResult.trace.traceId,
    timestamp: Date.now(),
    data: etkResult,
  });

  if (etkResult.decision.status !== "ALLOW") {
    throw new WalletError(
      "ETK_BLOCKED",
      etkResult.decision.reason ?? "BLOCKED",
      403,
    );
  }

  /* ─────────────────────────────
     5. EXECUTION
  ───────────────────────────── */

  const requestId = crypto.randomUUID();

  try {
    const result = await prisma.$transaction(async (tx: any) => {
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
      ]);

      if (!fromBalance) {
        throw new Error("Missing sender balance");
      }

      if (!toBalance) {
        throw new Error("Missing recipient balance");
      }

      const fromNextBaseUnits =
        BigInt(fromBalance.amountBaseUnits.toString()) - senderDebit;

      const toNextBaseUnits =
        BigInt(toBalance.amountBaseUnits.toString()) + recipientCredit;

      const debitTx = await tx.transaction.create({
        data: {
          userId: fromUserId,
          walletId: fromWallet.id,
          type: TRANSACTION_TYPES.DEBIT,

          amount: Number(formatBaseUnits(senderDebit, asset.decimals)),

          idempotencyKey,

          amountBaseUnits: bigintToDecimal(senderDebit),

          assetCode,

          metadata: {
            journalGroupId: idempotencyKey,

            direction: "OUT",

            fromNextBaseUnits: fromNextBaseUnits.toString(),

            toNextBaseUnits: toNextBaseUnits.toString(),

            requestId,
          },
        },
      });

      const creditTx = await tx.transaction.create({
        data: {
          userId: toUserId,
          walletId: toWallet.id,
          type: TRANSACTION_TYPES.CREDIT,

          amount: Number(formatBaseUnits(recipientCredit, asset.decimals)),

          amountBaseUnits: bigintToDecimal(recipientCredit),

          assetCode,

          metadata: {
            journalGroupId: idempotencyKey,

            direction: "IN",
          },
        },
      });

      await tx.balance.update({
        where: {
          id: fromBalance.id,
        },

        data: {
          amountBaseUnits: {
            decrement: bigintToDecimal(senderDebit),
          },
        },
      });

      await tx.balance.update({
        where: {
          id: toBalance.id,
        },

        data: {
          amountBaseUnits: {
            increment: bigintToDecimal(recipientCredit),
          },
        },
      });

      authorityLeakageVisualizer.ingest({
        type: "LEDGER_MUTATION",
        entityId: fromUserId,
        timestamp: Date.now(),
      });

      return {
        transactionId: debitTx.id,
        debitEventId: debitTx.id,
        creditEventId: creditTx.id,
        assetCode,

        fromNextBaseUnits: fromNextBaseUnits.toString(),

        toNextBaseUnits: toNextBaseUnits.toString(),

        idempotentReplay: false,
        requestId,
      };
    });

    return result;
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const replay = await recoverProcessedWalletTransfer(replayExpectation);

    if (!replay) {
      throw error;
    }

    return replay;
  }
}
