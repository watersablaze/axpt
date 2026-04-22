import { NextResponse } from 'next/server'
import { createResidentWallet } from '@/domains/wallet/createResidentWallet'
import { requirePermission } from '@/domains/auth/requirePermission'
import { PERMISSIONS } from '@/domains/auth/permissions'

export async function POST() {
  const principal = await requirePermission(PERMISSIONS.WALLET_INIT)
  const userId = principal.userId

  try {
    const wallet = await createResidentWallet(userId)

    return NextResponse.json({
      ok: true,
      message: 'Wallet initialized for resident.',
      wallet: {
        id: wallet.id,
        createdAt: wallet.createdAt,
        balances: wallet.balances.map((b: any) => ({
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
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'wallet init failed' },
      { status: 500 }
    )
  }
}