import { prisma } from '@/infrastructure/db/prisma'
import { transferToken } from '@/engines/wallet'
import { decimalToBigInt, formatBaseUnits } from '@/lib/money/baseUnits'
import { getAsset } from '@/lib/assets/registry'
import { recordDecisionOutcome } from './recordDecisionOutcome'
import { evaluatePostExecution } from './evaluatePostExecution'
import { updateTrustEdge } from '@/domains/risk/updateTrustEdge' 
import { recomputeSecurityState } from '../security/recomputeSecurityState'
import { TREASURY_ACTION_STATUS } from './stateMachine'

const EXECUTABLE_ACTION_STATUSES = [
  TREASURY_ACTION_STATUS.QUEUED,
  TREASURY_ACTION_STATUS.EXECUTING,
] as readonly string[]

export async function executeTreasuryAction(actionId: string) {
  const action = await prisma.treasuryAction.findUnique({
    where: { id: actionId },
  })

  if (!action) {
    throw new Error('Treasury action not found')
  }

  if (!EXECUTABLE_ACTION_STATUSES.includes(action.status)) {
    throw new Error(`Treasury action is not executable: ${action.status}`)
  }

  const amountBaseUnits = decimalToBigInt(action.amountBaseUnits)

  const assetCode = action.assetCode as 'AXG' | 'NMP' | 'USD'

  const asset = getAsset(assetCode) 

  try {
    const result = await transferToken({
      fromUserId: action.fromUserId,
      toUserId: action.toUserId,
      amount: formatBaseUnits(
        amountBaseUnits,
        asset.decimals
      ),
      assetCode,
      idempotencyKey: action.idempotencyKey,
      source: 'treasury-queue',
      bypassPolicy: true,
      metadata: {
        intent: action.intent,
        treasuryActionId: action.id,
        executionMode: 'QUEUE',
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
