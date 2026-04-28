import { NextRequest, NextResponse } from 'next/server'
import { TokenType, Prisma } from '@prisma/client'
import { prisma } from '@/infrastructure/db/prisma'
import { getAsset, type AssetCode } from '@/lib/assets/registry'
import { TRANSACTION_TYPES } from '@/domains/wallet/constants/transactionTypes'
import {
  bigintToDecimal,
  decimalToBigInt,
  formatBaseUnits,
  parseDisplayToBaseUnits,
} from '@/lib/money/baseUnits'

function parseTokenType(value: unknown): TokenType | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toUpperCase()

  if (!(normalized in TokenType)) return null

  return TokenType[normalized as keyof typeof TokenType]
}

function parseOptionalNote(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, 200) : null
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { ok: false, error: 'Not available in production' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const {
      email: rawEmail,
      tokenType: rawTokenType = 'AXG',
      amount: rawAmount,
      note: rawNote,
    } = body

    const email =
      typeof rawEmail === 'string'
        ? rawEmail.trim().toLowerCase()
        : ''

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'email is required' },
        { status: 400 }
      )
    }

    const tokenType = parseTokenType(rawTokenType)

    if (!tokenType || tokenType === TokenType.OTHER) {
      return NextResponse.json(
        { ok: false, error: 'tokenType is invalid' },
        { status: 400 }
      )
    }

    const asset = getAsset(tokenType as AssetCode)

    let amountBaseUnits: bigint
    try {
      amountBaseUnits = parseDisplayToBaseUnits(
        String(rawAmount ?? '').trim(),
        asset.decimals
      )
    } catch {
      return NextResponse.json(
        { ok: false, error: 'amount is invalid' },
        { status: 400 }
      )
    }

    if (amountBaseUnits <= 0n) {
      return NextResponse.json(
        { ok: false, error: 'amount must be positive' },
        { status: 400 }
      )
    }

    const amountDisplay = formatBaseUnits(
      amountBaseUnits,
      asset.decimals
    )

    const amountNumber = Number(amountDisplay)
    const note = parseOptionalNote(rawNote)

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        let wallet = await tx.wallet.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId: user.id },
            select: { id: true },
          })
        }

        let balance = await tx.balance.findFirst({
          where: {
            walletId: wallet.id,
            userId: user.id,
            assetCode: asset.code,
          },
          select: {
            id: true,
            amount: true,
            amountBaseUnits: true,
          },
        })

        if (!balance) {
          balance = await tx.balance.create({
            data: {
              walletId: wallet.id,
              userId: user.id,
              tokenType,
              assetCode: asset.code,
              amount: 0,
              amountBaseUnits: bigintToDecimal(0n),
            },
            select: {
              id: true,
              amount: true,
              amountBaseUnits: true,
            },
          })
        }

        const currentBaseUnits = decimalToBigInt(
          balance.amountBaseUnits ?? 0
        )

        const nextBaseUnits =
          currentBaseUnits + amountBaseUnits

        const updated = await tx.balance.update({
          where: { id: balance.id },
          data: {
            tokenType,
            assetCode: asset.code,
            amount: Number(
              formatBaseUnits(nextBaseUnits, asset.decimals)
            ),
            amountBaseUnits: bigintToDecimal(nextBaseUnits),
          },
          select: {
            id: true,
            amount: true,
            amountBaseUnits: true,
          },
        })

        const entry = await tx.transaction.create({
          data: {
            walletId: wallet.id,
            userId: user.id,
            type: TRANSACTION_TYPES.CREDIT,
            tokenType,
            assetCode: asset.code,
            amount: amountNumber,
            amountBaseUnits: bigintToDecimal(amountBaseUnits),
            metadata: {
              source: 'dev-faucet',
              note,
              prevAmountBaseUnits: currentBaseUnits.toString(),
              nextAmountBaseUnits: nextBaseUnits.toString(),
            },
          },
          select: { id: true },
        })

        return {
          walletId: wallet.id,
          balanceId: updated.id,
          transactionId: entry.id,
          newBalance: updated.amount,
          newBalanceBaseUnits: decimalToBigInt(
            updated.amountBaseUnits ?? 0
          ).toString(),
        }
      },
      {
        maxWait: 10_000,
        timeout: 15_000,
      }
    )

    return NextResponse.json({
      ok: true,
      funded: {
        email,
        tokenType,
        amount: amountNumber,
      },
      ...result,
    })
  } catch (err: unknown) {
    console.error('[dev wallet fund]', err)

    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'Funding failed',
      },
      { status: 500 }
    )
  }
}