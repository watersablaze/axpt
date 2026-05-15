import { prisma } from '@/infrastructure/db/prisma'
import { transferToken } from '@/engines/wallet'
import { decimalToBigInt, formatBaseUnits } from '@/lib/money/baseUnits'
import { getAsset } from '@/lib/assets/registry'
import { recordDecisionOutcome } from './recordDecisionOutcome'
import { evaluatePostExecution } from './evaluatePostExecution'
import { updateTrustEdge } from '@/domains/risk/updateTrustEdge'
import { recomputeSecurityState } from '../security/recomputeSecurityState'
import { TREASURY_ACTION_STATUS } from './stateMachine'

import { executionSignalAssembler } from "@/engines/signals/ExecutionSignalAssembler"
import { etk } from "@/engines/execution/kernel/ExecutionTruthKernel"

const EXECUTABLE_ACTION_STATUSES = [
  TREASURY_ACTION_STATUS.QUEUED,
  TREASURY_ACTION_STATUS.EXECUTING,
] as const

export async function executeTreasuryAction(actionId: string) {
  const action = await prisma.treasuryAction.findUnique({
    where: { id: actionId },
  })

  if (!action) throw new Error("Treasury action not found")

  if (!EXECUTABLE_ACTION_STATUSES.includes(action.status as any)) {
    throw new Error(`Treasury action not executable: ${action.status}`)
  }

  const assetCode = action.assetCode as "AXG" | "NMP" | "USD"
  const asset = getAsset(assetCode)
  const amountBaseUnits = decimalToBigInt(action.amountBaseUnits)

  /**
 * ─────────────────────────────────────────
 * 🧠 ETK PHASE 2 GATE (TREASURY)
 * ─────────────────────────────────────────
 */

const ETK_SHADOW_MODE = process.env.ETK_PHASE_2_SHADOW !== "false"

/**
 * 1. SIGNALS
 */
const signals = await executionSignalAssembler.build(
  action.fromUserId,
  {
    type: "TREASURY_EXECUTION",
    timestamp: Date.now(),
    entityId: action.fromUserId,
    amount: amountBaseUnits,
    wallet: undefined,
  }
)

/**
 * 2. SPINE (REQUIRED MISSING STEP IN YOUR CODE)
 */
const spine = authoritySpineCompiler.build(
  signals,
  action.fromUserId,
  {
    source: "TREASURY_EXECUTION",
    actionId: action.id,
    mode: "QUEUE_EXECUTION",
  }
)

/**
 * 3. ETK DECISION
 */
const etkResult = etk.decide(spine)

/**
 * 4. OBSERVABILITY
 */
console.log("[ETK_TREASURY_GATE]", {
  decision: etkResult.decision,
  trace: etkResult.trace.traceId,
})

/**
 * 5. HARD GATE
 */
if (!ETK_SHADOW_MODE && etkResult.decision.status !== "ALLOW") {
  await recordDecisionOutcome({
    actionId: action.id,
    intent: action.intent,
    success: false,
  })

  throw new Error(
    `ETK_BLOCKED_TREASURY: ${etkResult.decision.reason}`
  )
}

  /**
   * ─────────────────────────────────────────
   * EXECUTION PHASE
   * ─────────────────────────────────────────
   */
  try {
    const result = await transferToken({
      fromUserId: action.fromUserId,
      toUserId: action.toUserId,
      amount: formatBaseUnits(amountBaseUnits, asset.decimals),
      assetCode,
      idempotencyKey: action.idempotencyKey,
      source: "treasury-queue",
      bypassPolicy: true,
      metadata: {
        intent: action.intent,
        treasuryActionId: action.id,
        executionMode: "QUEUE",
      },
      roles: ["TREASURY_OPERATOR"],
      context: {
        principal: {
          userId: action.initiatorUserId,
          roles: ["TREASURY_OPERATOR"],
          permissions: ["WALLET_TRANSFER"],
        },
        senderUserId: action.fromUserId,
        recipientUserId: action.toUserId,
        assetCode: action.assetCode,
        amountBaseUnits,
        intent: action.intent as any,
      },
    })

    await evaluatePostExecution(action.id)
    await recomputeSecurityState({ limit: 25 })

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