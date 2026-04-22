import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'
import { transferToken } from '@/engines/wallet'
import { getPrincipal } from '@/domains/auth/getPrincipal'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const principal = await getPrincipal()

  if (!principal) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const action = await prisma.treasuryAction.findUnique({
    where: { id: params.id },
  })

  if (!action || action.status !== 'APPROVED') {
    return NextResponse.json(
      { ok: false, error: 'Not executable' },
      { status: 400 }
    )
  }

  const result = await transferToken({
    fromUserId: action.fromUserId,
    toUserId: action.toUserId,
    amount: action.amountBaseUnits.toString(),
    assetCode: action.assetCode,
    idempotencyKey: `treasury-exec-${action.id}`,
    metadata: {
      intent: action.intent,
      treasuryActionId: action.id,
    },
  })

  await prisma.treasuryAction.update({
    where: { id: action.id },
    data: {
      status: 'EXECUTED',
    },
  })

  return NextResponse.json({ ok: true, result })
}