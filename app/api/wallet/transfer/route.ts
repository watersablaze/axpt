import { NextResponse } from 'next/server'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { transferToken } from '@/engines/wallet'
import { prisma } from '@/infrastructure/db/prisma'
import { getAsset } from '@/lib/assets/registry'
import { parseDisplayToBaseUnits } from '@/lib/money/baseUnits'
import type { TransferIntent } from '@/domains/wallet/types/transferContext'

const TRANSFER_INTENTS = new Set<TransferIntent>([
  'PEER',
  'TREASURY',
  'INVESTMENT',
  'REWARD',
])

function getIdempotencyKey(req: Request) {
  return req.headers.get('Idempotency-Key')?.trim() || null
}

export async function POST(req: Request) {
  try {
    const principal = await getPrincipal()

    if (!principal) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const fromUserId = principal.userId
    const idempotencyKey = getIdempotencyKey(req)

    if (!idempotencyKey) {
      return NextResponse.json(
        { ok: false, error: 'Missing Idempotency-Key header' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const {
      toUserId: rawToUserId,
      toEmail,
      amount,
      note,
      feeBps,
      feeMode,
      intent: rawIntent = 'PEER',
      assetCode: rawAssetCode = 'AXG',
    } = body || {}

    const amountStr = String(amount ?? '').trim()
    if (!amountStr || isNaN(Number(amountStr))) {
      return NextResponse.json(
        { ok: false, error: 'amount must be a valid number' },
        { status: 400 }
      )
    }

    let toUserId: string | null = rawToUserId || null

    if (!toUserId && toEmail) {
      const user = await prisma.user.findUnique({
        where: { email: toEmail },
        select: { id: true },
      })

      if (!user) {
        return NextResponse.json(
          { ok: false, error: 'Recipient not found for email' },
          { status: 404 }
        )
      }

      toUserId = user.id
    }

    if (!toUserId) {
      return NextResponse.json(
        { ok: false, error: 'toUserId or toEmail is required' },
        { status: 400 }
      )
    }

    const normalizedIntent = String(rawIntent).toUpperCase()
    if (!TRANSFER_INTENTS.has(normalizedIntent as TransferIntent)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid transfer intent' },
        { status: 400 }
      )
    }

    const intent = normalizedIntent as TransferIntent
    const asset = getAsset(rawAssetCode)
    const amountBaseUnits = parseDisplayToBaseUnits(
      amountStr,
      asset.decimals
    )

    const result = await transferToken({
      fromUserId,
      toUserId,
      amount: amountStr,
      assetCode: asset.code,
      note: note ?? null,
      idempotencyKey,
      source: 'api',
      feeBps: typeof feeBps === 'number' ? feeBps : 0,
      feeMode: feeMode ?? 'SENDER_PAYS',
      metadata: {
        intent,
      },
      roles: principal.roles,
      context: {
        principal,
        senderUserId: fromUserId,
        recipientUserId: toUserId,
        assetCode: asset.code,
        amountBaseUnits,
        intent,
      },
    })

    return NextResponse.json({ ok: true, ...result }, { status: 200 })
  } catch (err) {
    console.error('[TRANSFER ERROR]', err)

    if (err instanceof Error && 'code' in err) {
      const walletErr = err as Error & {
        code?: string
        status?: number
      }
      const treasuryMatch =
        walletErr.code === 'TREASURY_ACTION_CREATED'
          ? walletErr.message.match(
              /^Approval required \(([^)]+)\)\. Action ID: (.+)$/
            )
          : null

      return NextResponse.json(
        {
          ok: false,
          code: walletErr.code ?? 'UNKNOWN',
          error: walletErr.message,
          ...(treasuryMatch
            ? {
                approvalType: treasuryMatch[1],
                actionId: treasuryMatch[2],
              }
            : {}),
        },
        { status: walletErr.status ?? 400 }
      )
    }

    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
