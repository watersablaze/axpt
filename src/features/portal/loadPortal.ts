// src/features/portal/loadPortal.ts
import { prisma } from '@/lib/prisma';

export async function loadPortal(userId: string) {
  const [wallet, proposals, issuance] = await Promise.all([
    prisma.wallet.findFirst({
      where: { userId },
      include: { balances: { include: { token: true } } },
      orderBy: { id: 'asc' }, // Wallet has no createdAt; use id or omit
    }),
    prisma.governanceProposal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, title: true, status: true, createdAt: true,
        quorum: true, approvalThreshold: true, readyAt: true, votingEndsAt: true,
      },
    }),
    prisma.tokenIssuanceRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, symbol: true, name: true, status: true, createdAt: true },
    }),
  ]);

  const balances = (wallet?.balances ?? [])
    .map(b => ({ label: b.token ? b.token.symbol : (b.tokenType ?? '—'), amount: b.amount }))
    .sort((a, b) => (a.label === 'AXG' ? -1 : b.label === 'AXG' ? 1 : a.label.localeCompare(b.label)));

  return { wallet, balances, proposals, issuance };
}