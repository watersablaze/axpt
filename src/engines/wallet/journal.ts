import { TRANSACTION_TYPES } from "@/domains/wallet/constants/transactionTypes";

import { prisma } from "@/infrastructure/db/prisma";

export async function findProcessedWalletDebitEvent(idempotencyKey: string) {
  return prisma.transaction.findFirst({
    where: {
      type: TRANSACTION_TYPES.DEBIT,
      idempotencyKey,
    },
  });
}

export async function findProcessedWalletTransfer(idempotencyKey: string) {
  const debit = await findProcessedWalletDebitEvent(idempotencyKey);

  if (!debit) {
    return null;
  }

  const credits = await prisma.transaction.findMany({
    where: {
      type: TRANSACTION_TYPES.CREDIT,

      AND: [
        {
          metadata: {
            path: ["journalGroupId"],
            equals: idempotencyKey,
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
    throw new Error("WALLET_JOURNAL_INTEGRITY_VIOLATION");
  }

  return {
    debit,
    credit: credits[0],
  };
}

export async function alreadyProcessedWalletKey(idempotencyKey?: string) {
  if (!idempotencyKey) {
    return false;
  }

  const existing = await findProcessedWalletDebitEvent(idempotencyKey);

  return Boolean(existing);
}
