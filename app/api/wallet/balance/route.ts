import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'
import { getAsset } from '@/lib/assets/registry'
import { formatBaseUnits } from '@/lib/money/baseUnits'

type BalanceRow = {
  id: string
  walletId: string
  userId: string
  assetCode: string | null
  tokenType: string | null
  amount: number
  amountBaseUnits: { toString(): string } | null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const userId = searchParams.get('userId')
  const walletId = searchParams.get('walletId')
  const assetCodeParam = searchParams.get('assetCode')

  if (!userId && !walletId) {
    return NextResponse.json(
      { error: 'userId or walletId is required' },
      { status: 400 }
    )
  }

  const where: Record<string, string> = {}

  if (userId) where.userId = userId
  if (walletId) where.walletId = walletId
  if (assetCodeParam) where.assetCode = assetCodeParam

  const balances = await prisma.balance.findMany({
    where,
    select: {
      id: true,
      walletId: true,
      userId: true,
      assetCode: true,
      tokenType: true,
      amount: true,
      amountBaseUnits: true,
    },
    orderBy: [{ assetCode: 'asc' }, { tokenType: 'asc' }],
  })

  const normalized = balances.map((balance: BalanceRow) => {
    const resolvedAssetCode =
      typeof balance.assetCode === 'string'
        ? balance.assetCode
        : typeof balance.tokenType === 'string'
        ? balance.tokenType
        : null

    const baseUnits = balance.amountBaseUnits?.toString() ?? '0'

    if (!resolvedAssetCode) {
      return {
        id: balance.id,
        walletId: balance.walletId,
        userId: balance.userId,
        assetCode: null,
        balance: String(balance.amount ?? 0),
        balanceBaseUnits: baseUnits,
        decimals: null,
      }
    }

    const asset = getAsset(resolvedAssetCode as 'AXG' | 'NMP' | 'USD')

    return {
      id: balance.id,
      walletId: balance.walletId,
      userId: balance.userId,
      assetCode: resolvedAssetCode,
      balance: formatBaseUnits(BigInt(baseUnits), asset.decimals),
      balanceBaseUnits: baseUnits,
      decimals: asset.decimals,
    }
  })

  return NextResponse.json({
    count: normalized.length,
    balances: normalized,
  })
}