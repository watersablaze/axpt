// app/api/mirror/balance/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'
import { resolveLedgerAccountId } from '@/domains/mirror/ledgerAccounts'

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

  const entries = await prisma.ledgerEntry.findMany({
    where: {
      chainId,
      tokenType,
      accountId,
    },
    select: {
      direction: true,
      amount: true,
      txHash: true,
      blockNumber: true,
      createdAt: true,
    },
    orderBy: [
      { blockNumber: 'asc' },
      { createdAt: 'asc' },
    ],
  })

  let credits = 0n
  let debits = 0n

  for (const entry of entries) {
    const amount = BigInt(entry.amount)

    if (entry.direction === 'CREDIT') {
      credits += amount
    } else if (entry.direction === 'DEBIT') {
      debits += amount
    }
  }

  const balance = credits - debits

  return NextResponse.json({
    chainId,
    tokenType,
    accountId,
    credits: credits.toString(),
    debits: debits.toString(),
    balance: balance.toString(),
    entryCount: entries.length,
  })
}