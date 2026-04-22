import { PlannedAction } from './intentPlanner'
import { readSystemState } from './systemState'
import { prisma } from '@/infrastructure/db/prisma'
import { syncChainEvents } from '@/domains/mirror/chainSync'
import { reconcileThreeLayer } from '@/domains/reconciliation/reconcileThreeLayer'
import { verifyMirrorIntegrity } from '@/domains/mirror/chainVerification'
import { setSystemPause } from '@/lib/system/pause'
import type { IntentType } from './intentTypes'

export async function executeIntent(intent: IntentType, actions: PlannedAction[]) {
  await prisma.circuitEvent.create({
    data: {
      type: 'INTENT',
      severity: 'INFO',
      message: `Intent started: ${intent}`,
      metadata: { actionCount: actions.length },
    },
  })

  for (const action of actions) {
    const state = await readSystemState()

    // 🔥 CONDITIONAL EXECUTION
    if (action.condition && !action.condition(state)) {
      continue
    }

    try {
      switch (action.type) {
        case 'RUN_SYNC':
          await syncChainEvents()
          break

        case 'RUN_RECON':
          await reconcileThreeLayer()
          break

        case 'VERIFY_CHAIN':
          await verifyMirrorIntegrity()
          break

        case 'CLEAR_DEAD_LETTERS':
          await prisma.circuitEvent.create({
            data: {
              type: 'INTENT_STEP',
              severity: 'WARN',
              message: 'SKIPPED CLEAR_DEAD_LETTERS',
              metadata: { reason: 'No clear-DLQ handler implemented' },
            },
          })
          break

        case 'PAUSE_SYSTEM':
          await setSystemPause(true, `Intent pause: ${intent}`)
          break

        case 'RESUME_SYSTEM':
          await setSystemPause(false)
          break
      }

      // ✅ success log
      await prisma.circuitEvent.create({
        data: {
          type: 'INTENT_STEP',
          severity: 'INFO',
          message: action.type,
          metadata: { status: 'SUCCESS' },
        },
      })
    } catch (err) {
      // ❌ failure log
      await prisma.circuitEvent.create({
        data: {
          type: 'INTENT_STEP',
          severity: 'CRITICAL',
          message: `FAILED ${action.type}`,
          metadata: { error: String(err) },
        },
      })

      break // 🔥 STOP execution chain
    }
  }

  await prisma.circuitEvent.create({
    data: {
      type: 'INTENT',
      severity: 'INFO',
      message: `Intent completed: ${intent}`,
      metadata: { status: 'COMPLETED' },
    },
  })
}
