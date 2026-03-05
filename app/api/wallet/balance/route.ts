// app/api/wallet/balance/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveLedgerAccountId } from '@/engines/wallet/chainMirror/ledgerAccounts'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const chainId = Number(searchParams.get('chainId'))
  const tokenType = searchParams.get('tokenType')
  const address = searchParams.get('address')
  const accountIdParam = searchParams.get('accountId')

  if (!chainId || !tokenType) {
    return NextResponse.json(
      { error: 'chainId and tokenType are required' },
      { status: 400 }
    )
  }

  let accountId = accountIdParam ?? null

  if (!accountId && address) {
    accountId = await resolveLedgerAccountId({
      chainId,
      tokenType,
      treasuryAddress: address as `0x${string}`,
      address: address as `0x${string}`,
    })
  }

  if (!accountId) {
    return NextResponse.json(
      { error: 'accountId or address required' },
      { status: 400 }
    )
  }

  const entries = await prisma.ledgerEntry.aggregate({
    where: {
      chainId,
      tokenType,
      accountId,
    },
    _sum: {
      amount: true,
    },
  })

  const credits = await prisma.ledgerEntry.aggregate({
    where: {
      chainId,
      tokenType,
      accountId,
      direction: 'CREDIT',
    },
    _sum: { amount: true },
  })

  const debits = await prisma.ledgerEntry.aggregate({
    where: {
      chainId,
      tokenType,
      accountId,
      direction: 'DEBIT',
    },
    _sum: { amount: true },
  })

  const creditSum = BigInt(credits._sum.amount ?? '0')
  const debitSum = BigInt(debits._sum.amount ?? '0')

  const balance = creditSum - debitSum

  return NextResponse.json({
    chainId,
    tokenType,
    accountId,
    balance: balance.toString(),
  })
}