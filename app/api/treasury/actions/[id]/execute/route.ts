import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { triggerTreasuryExecution } from '@/domains/treasury/triggerExecution'
import { TREASURY_ACTION_STATUS } from '@/domains/treasury/stateMachine'

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

  if (
    !action ||
    ![
      TREASURY_ACTION_STATUS.APPROVED,
      TREASURY_ACTION_STATUS.QUEUED,
    ].includes(action.status as any)
  ) {
    return NextResponse.json(
      { ok: false, error: 'Not executable' },
      { status: 400 }
    )
  }

  const queueJob = await triggerTreasuryExecution(
    action.id
  )

  return NextResponse.json({ ok: true, queueJob })
}
