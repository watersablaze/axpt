import { prisma } from '@/lib/prisma';

export async function alreadyProcessedWalletKey(idempotencyKey?: string) {
  if (!idempotencyKey) return false;
  const existing = await prisma.walletEvent.findUnique({ where: { idempotencyKey } });
  return Boolean(existing);
}