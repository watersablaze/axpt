import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'
import { triggerTreasuryExecution } from '@/domains/treasury/triggerExecution'
import { TREASURY_ACTION_STATUS } from '@/domains/treasury/stateMachine'
import { requirePermission } from '@/domains/auth/requirePermission'
import { PERMISSIONS } from '@/domains/auth/permissions'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {

  await requirePermission(
  PERMISSIONS.TREASURY_EXECUTE
)

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
