import { prisma } from '@/infrastructure/db/prisma'
import { transferToken } from '@/engines/wallet'
import { decimalToBigInt, formatBaseUnits } from '@/lib/money/baseUnits'
import { recordDecisionOutcome } from './recordDecisionOutcome'
import { evaluatePostExecution } from './evaluatePostExecution'
import { updateTrustEdge } from '@/domains/risk/updateTrustEdge' 
import { recomputeSecurityState } from '../security/recomputeSecurityState'

export async function executeTreasuryAction(actionId: string) {
  const action = await prisma.treasuryAction.findUnique({
    where: { id: actionId },
  })

  if (!action) {
    throw new Error('Treasury action not found')
  }

  if (action.status !== 'APPROVED') {
    throw new Error(`Treasury action is not executable: ${action.status}`)
  }

  const amountBaseUnits = decimalToBigInt(action.amountBaseUnits)

  const assetCode = action.assetCode as 'AXG' | 'NMP' | 'USD'

  try {
    const result = await transferToken({
      fromUserId: action.fromUserId,
      toUserId: action.toUserId,
      amount: formatBaseUnits(amountBaseUnits, 6),
      assetCode,
      idempotencyKey: action.idempotencyKey,
      source: 'treasury-queue',
      metadata: {
        intent: action.intent,
        treasuryActionId: action.id,
      },
      roles: ['TREASURY_OPERATOR'],
      context: {
        principal: {
          userId: action.initiatorUserId,
          roles: ['TREASURY_OPERATOR'],
          permissions: ['WALLET_TRANSFER'],
        },
        senderUserId: action.fromUserId,
        recipientUserId: action.toUserId,
        assetCode: action.assetCode,
        amountBaseUnits,
        intent: action.intent as any,
      },
    })

    await prisma.treasuryAction.update({
      where: { id: action.id },
      data: {
        status: 'EXECUTED',
        executedAt: new Date(),
        executionError: null,
        metadata: {
          ...(action.metadata as Record<string, unknown> | null),
          execution: result,
        },
      },
    })

    await evaluatePostExecution(action.id)

    await recomputeSecurityState({ limit: 25 }) // small scoped recalculation

    await recordDecisionOutcome({
      actionId: action.id,
      intent: action.intent,
      success: true,
    })

    await updateTrustEdge({
      fromUserId: action.fromUserId,
      toUserId: action.toUserId,
      success: true,
    })

    return result
  } catch (err) {
    await prisma.treasuryAction.update({
      where: { id: action.id },
      data: {
        status: 'FAILED',
        executionError: String(err),
      },
    })

    await recordDecisionOutcome({
      actionId: action.id,
      intent: action.intent,
      success: false,
    })

    await updateTrustEdge({
        fromUserId: action.fromUserId,
        toUserId: action.toUserId,
        success: false,
        })

    throw err
  }
}
