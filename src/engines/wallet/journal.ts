import { TRANSACTION_TYPES } from '@/domains/wallet/constants/transactionTypes';
import { prisma } from '@/infrastructure/db/prisma';

export async function alreadyProcessedWalletKey(idempotencyKey?: string) {
  if (!idempotencyKey) return false;
  const existing = await prisma.transaction.findFirst({
    where: {
      type: TRANSACTION_TYPES.DEBIT,
      metadata: {
        path: ['idempotencyKey'],
        equals: idempotencyKey,
      },
    },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function findProcessedWalletDebitEvent(idempotencyKey: string) {
  return prisma.transaction.findFirst({
    where: {
      type: TRANSACTION_TYPES.DEBIT,
      metadata: {
        path: ['idempotencyKey'],
        equals: idempotencyKey,
      },
    },
  });
}
