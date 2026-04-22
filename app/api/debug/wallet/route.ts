import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { prisma } from '@/infrastructure/db/prisma'

export async function GET() {
  try {
    const principal = await getPrincipal()

    if (!principal) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let wallet = await prisma.wallet.findUnique({
      where: { userId: principal.userId },
      include: {
        balances: { orderBy: { assetCode: 'asc' } },
        transactions: {
          take: 15,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    // 🔥 AUTO-HEAL: create wallet if missing
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: principal.userId,
        },
        include: {
          balances: true,
          transactions: true,
        },
      })

      console.warn(
        `[DEBUG WALLET] Auto-created wallet for ${principal.email}`
      )
    }

    return NextResponse.json({
      ok: true,
      principal: {
        userId: principal.userId,
        email: principal.email,
        roles: principal.roles,
      },
      wallet,
    })
  } catch (err) {
    console.error('[debug/wallet]', err)

    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'Wallet debug failed',
      },
      { status: 500 }
    )
  }
}