import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { resolveApproval } from '@/domains/treasury/resolveApproval'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const principal = await getPrincipal()

    if (!principal) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    const isElder = await prisma.councilElder.findUnique({
      where: { userId: principal.userId },
    })

    if (!isElder) {
      return NextResponse.json(
        { ok: false, error: 'Not authorized to reject' },
        { status: 403 }
      )
    }

    const action = await prisma.treasuryAction.findUnique({
      where: { id: params.id },
      include: { approvals: true },
    })

    if (!action || action.status !== 'PENDING') {
      return NextResponse.json(
        { ok: false, error: 'Invalid action state' },
        { status: 400 }
      )
    }

    if (action.initiatorUserId === principal.userId) {
      return NextResponse.json(
        { ok: false, error: 'Cannot reject your own action' },
        { status: 403 }
      )
    }

    await prisma.treasuryApproval.create({
      data: {
        actionId: action.id,
        approverUserId: principal.userId,
        decision: 'REJECTED',
      },
    })

    const updated = await prisma.treasuryAction.findUnique({
      where: { id: action.id },
      include: { approvals: true },
    })

    const totalElders = await prisma.councilElder.count()

    const resolution = resolveApproval({
      approvalType: action.approvalType as any,
      approvals: updated?.approvals ?? [],
      totalElders,
    })

    await prisma.treasuryAction.update({
      where: { id: action.id },
      data: {
        status: resolution.status,
      },
    })

    return NextResponse.json({
      ok: true,
      status: resolution.status,
    })
  } catch (err) {
    const prismaErr = err as { code?: string }

    if (prismaErr.code === 'P2002') {
      return NextResponse.json(
        { ok: false, error: 'You have already rejected this action' },
        { status: 409 }
      )
    }

    console.error('[TREASURY_ACTION_REJECT_ERROR]', err)
    return NextResponse.json(
      { ok: false, error: 'Failed to reject treasury action' },
      { status: 500 }
    )
  }
}
