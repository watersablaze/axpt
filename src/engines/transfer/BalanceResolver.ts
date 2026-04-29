import { prisma } from '@/infrastructure/db/prisma'
import { getAsset } from '@/lib/assets/registry'

export type AssetCode = 'AXG' | 'NMP' | 'USD'

export type BalanceSnapshot = {
  walletId: string
  userId: string
  assetCode: AssetCode
  amountBaseUnits: bigint
}

export type ResolvedBalances = {
  sender: BalanceSnapshot
  receiver: BalanceSnapshot
}

export class BalanceResolver {
  /**
   * PURE READ LAYER
   * No mutation. No side effects.
   */
  async resolve(params: {
    fromUserId: string
    toUserId: string
    assetCode: AssetCode
  }): Promise<ResolvedBalances> {
    const asset = getAsset(params.assetCode)

    if (!asset) {
      throw new Error('UNKNOWN_ASSET')
    }

    const [senderWallet, receiverWallet] = await Promise.all([
      prisma.wallet.findUnique({
        where: { userId: params.fromUserId },
      }),
      prisma.wallet.findUnique({
        where: { userId: params.toUserId },
      }),
    ])

    if (!senderWallet) throw new Error('SENDER_WALLET_NOT_FOUND')
    if (!receiverWallet) throw new Error('RECEIVER_WALLET_NOT_FOUND')

    const [senderBalance, receiverBalance] = await Promise.all([
      prisma.balance.findFirst({
        where: {
          walletId: senderWallet.id,
          userId: params.fromUserId,
          assetCode: asset.code,
        },
      }),

      prisma.balance.findFirst({
        where: {
          walletId: receiverWallet.id,
          userId: params.toUserId,
          assetCode: asset.code,
        },
      }),
    ])

    /**
     * HARD INVARIANT:
     * balances must always resolve to a deterministic snapshot
     */

    return {
      sender: {
        walletId: senderWallet.id,
        userId: params.fromUserId,
        assetCode: asset.code,
        amountBaseUnits: BigInt(senderBalance?.amountBaseUnits ?? 0),
      },

      receiver: {
        walletId: receiverWallet.id,
        userId: params.toUserId,
        assetCode: asset.code,
        amountBaseUnits: BigInt(receiverBalance?.amountBaseUnits ?? 0),
      },
    }
  }
}