// app/api/wallet/init/route.ts
import { NextResponse } from 'next/server';
import { createResidentWallet } from '@/lib/wallet/createResidentWallet';
import { requireResidentServer } from '@/lib/auth/requireResidentServer';

export async function POST() {
  const { userId } = await requireResidentServer();

  try {
    const wallet = await createResidentWallet(userId);
    return NextResponse.json({
      ok: true,
      message: 'Wallet initialized for resident.',
      wallet: {
        id: wallet.id,
        createdAt: wallet.createdAt,
        balances: wallet.balances.map(b => ({
          id: b.id,
          label: b.token ? b.token.symbol : b.tokenType,
          amount: b.amount,
        })),
        blockchainWallet: wallet.blockchainWallet
          ? {
              id: wallet.blockchainWallet.id,
              network: wallet.blockchainWallet.network,
              address: wallet.blockchainWallet.address,
            }
          : null,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'wallet init failed' }, { status: 500 });
  }
}