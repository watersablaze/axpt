// src/lib/wallet/createResidentWallet.ts
import { prisma } from '@/infrastructure/db/prisma';
import { ASSET_REGISTRY } from '@/lib/assets/registry';
import { bigintToDecimal } from '@/lib/money/baseUnits';
import { TokenType } from '@prisma/client'

function toTokenType(code: string): TokenType {
  if (code in TokenType) {
    return TokenType[
      code as keyof typeof TokenType
    ]
  }

  return TokenType.OTHER
}

export async function createResidentWallet(userId: string) {
  // 1) Ensure wallet exists (1:1 with user)
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      balances: { include: { token: true } },
      blockchainWallet: true,
    },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId }, // ✅ no 'address' here — matches your schema
      include: {
        balances: { include: { token: true } },
        blockchainWallet: true,
      },
    });
  }

  // 2) Ensure core balances exist in canonical asset registry terms
  const want = [ASSET_REGISTRY.AXG, ASSET_REGISTRY.NMP];
  const have = new Set(
    wallet.balances
      .map((b: any) => b.assetCode || (b.token ? b.token.symbol : b.tokenType))
      .filter(Boolean) as string[]
  );

  for (const asset of want) {
    if (!have.has(asset.code)) {
      await prisma.balance.create({
        data: {
          userId,
          walletId: wallet.id,
          tokenType: toTokenType(asset.code),
          assetCode: asset.code,
          amount: 0,
          amountBaseUnits: bigintToDecimal(0n),
        },
      });
    }
  }

  // 3) Ensure a BlockchainWallet stub exists (no on-chain address yet)
  if (!wallet.blockchainWallet) {
    await prisma.blockchainWallet.create({
      data: {
        userId,
        walletId: wallet.id,
        network: null,
        address: null,
      },
    });
  }

  // 4) Re-read with relations for a complete return
  const full = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      balances: { include: { token: true } },
      blockchainWallet: true,
    },
  });

  return full!; // safe now
}
