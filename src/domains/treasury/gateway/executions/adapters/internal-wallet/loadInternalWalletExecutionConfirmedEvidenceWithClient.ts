import type { TransactionClient } from "@prisma/client";

import { TRANSACTION_TYPES } from "@/domains/wallet/constants/transactionTypes";

import type { TreasuryExecutionId } from "../../../shared/identifiers";

import type { InternalWalletExecutionConfirmedEvidence } from "./executionEvidenceContracts";

import { loadInternalWalletTreasuryActionWithClient } from "./loadInternalWalletTreasuryActionWithClient";

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

export async function loadInternalWalletExecutionConfirmedEvidenceWithClient(params: {
  executionId: TreasuryExecutionId;

  confirmedAt: Date;

  client: TransactionClient;
}): Promise<InternalWalletExecutionConfirmedEvidence | null> {
  const { executionId, confirmedAt, client } = params;

  const action = await loadInternalWalletTreasuryActionWithClient({
    executionId,

    client,
  });

  const [senderWallet, receiverWallet] = await Promise.all([
    client.wallet.findUnique({
      where: {
        userId: action.fromUserId,
      },
    }),

    client.wallet.findUnique({
      where: {
        userId: action.toUserId,
      },
    }),
  ]);

  if (!senderWallet || !receiverWallet) {
    throw new Error(
      `[TREASURY_GATEWAY_INTERNAL_WALLET_WALLET_IDENTITY_MISSING] ${executionId}`,
    );
  }

  if (!action) {
    return null;
  }

  const debit = await client.transaction.findUnique({
    where: {
      idempotencyKey: action.idempotencyKey,
    },
  });

  if (!debit) {
    return null;
  }

  if (debit.type !== TRANSACTION_TYPES.DEBIT) {
    throw new Error(
      `[TREASURY_GATEWAY_INTERNAL_WALLET_DEBIT_TYPE_MISMATCH] ${debit.type}`,
    );
  }

  const credits = await client.transaction.findMany({
    where: {
      type: TRANSACTION_TYPES.CREDIT,

      AND: [
        {
          metadata: {
            path: ["journalGroupId"],

            equals: action.idempotencyKey,
          },
        },

        {
          metadata: {
            path: ["direction"],

            equals: "IN",
          },
        },
      ],
    },

    take: 2,
  });

  if (credits.length !== 1) {
    throw new Error(
      `[TREASURY_GATEWAY_INTERNAL_WALLET_CREDIT_CARDINALITY_VIOLATION] ${executionId} -> ${credits.length}`,
    );
  }

  const credit = credits[0];

  const debitAmount = debit.amountBaseUnits?.toString();

  const creditAmount = credit.amountBaseUnits?.toString();

  const actionAmount = action.amountBaseUnits.toString();

  const debitJournalGroupId = readMetadataString(
    debit.metadata,
    "journalGroupId",
  );

  const debitDirection = readMetadataString(debit.metadata, "direction");

  const creditJournalGroupId = readMetadataString(
    credit.metadata,
    "journalGroupId",
  );

  const creditDirection = readMetadataString(credit.metadata, "direction");

  const identityMatches =
    debit.userId === action.fromUserId &&
    debit.walletId === senderWallet.id &&
    debit.assetCode === action.assetCode &&
    debitAmount === actionAmount &&
    debitJournalGroupId === action.idempotencyKey &&
    debitDirection === "OUT" &&
    credit.userId === action.toUserId &&
    credit.walletId === receiverWallet.id &&
    credit.assetCode === action.assetCode &&
    creditAmount === actionAmount &&
    creditJournalGroupId === action.idempotencyKey &&
    creditDirection === "IN";

  if (!identityMatches) {
    throw new Error(
      `[TREASURY_GATEWAY_INTERNAL_WALLET_LEDGER_IDENTITY_MISMATCH] ${executionId}`,
    );
  }

  return {
    executionId,

    treasuryActionId: action.id,

    idempotencyKey: action.idempotencyKey,

    debitTransactionId: debit.id,

    creditTransactionId: credit.id,

    assetCode: action.assetCode,

    amountBaseUnits: actionAmount,

    confirmedAt,
  };
}
