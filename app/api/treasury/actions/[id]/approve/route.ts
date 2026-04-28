import type { TransactionClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import { prisma } from '@/infrastructure/db/prisma'
import { getPrincipal } from '@/domains/auth/getPrincipal'
import { resolveApproval } from '@/domains/treasury/resolveApproval'
import { triggerTreasuryExecution } from '@/domains/treasury/triggerExecution'
import {
  TREASURY_ACTION_STATUS,
  type TreasuryActionStatus,
} from '@/domains/treasury/stateMachine'
import { transitionTreasuryAction } from '@/domains/treasury/transitionTreasuryAction'

export async function POST(
  _req: Request,
  context: {
    params: Promise<{ id: string }>
  }
){
  try {
    const principal = await getPrincipal()

    if (!principal) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    /**
     * 🔐 Governance Gate
     *
     * TEMP DEV MODE:
     * allow either:
     * - council elder
     * - treasury approval permission
     */

    const isElder = await prisma.councilElder.findUnique({
      where: {
        userId: principal.userId,
      },
    })

    const canApprove =
      isElder ||
      principal.permissions.includes(
        'TREASURY_APPROVE'
      )

    if (!canApprove) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Not authorized to approve',
        },
        {
          status: 403,
        }
      )
    }

    /**
     * 🧠 Atomic Approval + Resolution
     */
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const action = await tx.treasuryAction.findUnique({
          where: { id },
          include: { approvals: true },
        })

        if (
          !action ||
          action.status !== TREASURY_ACTION_STATUS.PENDING
        ) {
          throw new Error('INVALID_STATE')
        }

        if (action.initiatorUserId === principal.userId) {
          throw new Error('SELF_APPROVAL_FORBIDDEN')
        }

        /**
         * 🗳 Record Approval (unique constraint protects duplicates)
         */
        await tx.treasuryApproval.create({
          data: {
            actionId: action.id,
            approverUserId: principal.userId,
            decision: 'APPROVED',
          },
        })

        /**
         * 🔄 Re-fetch approvals after insert
         */
        const updated = await tx.treasuryAction.findUnique({
          where: { id: action.id },
          include: { approvals: true },
        })

        const totalElders = await tx.councilElder.count()

        const resolution = resolveApproval({
          approvalType: action.approvalType as any,
          approvals: updated?.approvals ?? [],
          totalElders,
        })

        /**
         * 🧾 Persist final status
         */
        const finalStatus =
          resolution.status as TreasuryActionStatus

        if (finalStatus !== action.status) {
          await transitionTreasuryAction({
            id: action.id,
            to: finalStatus,
            client: tx,
          })
        }

        return {
          actionId: action.id,
          status: finalStatus,
        }
      }
    )

    /**
     * 🚀 Trigger execution AFTER transaction commits
     */
    if (result.status === TREASURY_ACTION_STATUS.APPROVED) {
      triggerTreasuryExecution(result.actionId).catch((err) => {
        console.error('[TREASURY_EXECUTION_TRIGGER_FAILED]', {
          actionId: result.actionId,
          error: err,
        })
      })
    }

    return NextResponse.json({
      ok: true,
      status: result.status,
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error'

    /**
     * 🎯 Controlled error mapping
     */
    if (message === 'INVALID_STATE') {
      return NextResponse.json(
        { ok: false, error: 'Invalid action state' },
        { status: 400 }
      )
    }

    if (message === 'SELF_APPROVAL_FORBIDDEN') {
      return NextResponse.json(
        { ok: false, error: 'Cannot approve your own action' },
        { status: 403 }
      )
    }

    const prismaErr = err as { code?: string }

    if (prismaErr.code === 'P2002') {
      return NextResponse.json(
        { ok: false, error: 'You have already approved this action' },
        { status: 409 }
      )
    }

    console.error('[TREASURY_ACTION_APPROVE_ERROR]', err)

    return NextResponse.json(
      { ok: false, error: 'Failed to approve treasury action' },
      { status: 500 }
    )
  }
}
