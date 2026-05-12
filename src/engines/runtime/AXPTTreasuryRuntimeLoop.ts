import {
  organismClock,
  organismSnapshotStore,
  reconciliationEngine,
} from "./serverSingletons"
import { executionIntentQueue } from "@/engines/execution/queue/AXPTExecutionIntentQueue"
import { executionEngine } from "@/engines/execution/AXPTExecutionEngine"
import { circuitBreakerEngine } from "@/engines/safety/AXPTCircuitBreakerEngine"
import { organismSnapshotLock } from "@/engines/safety/AXPTOrganismSnapshotLock"

/**
 * 🧭 AXPT TREASURY CLOSED LOOP ENGINE
 */
export class AXPTTreasuryRuntimeLoop {
  private running = false

  start() {
    if (this.running) return
    this.running = true

    organismClock.subscribe(async () => {
      await this.tick()
    })
  }

private async tick() {

  const state = organismSnapshotStore.getLatest()
  if (!state) return

  circuitBreakerEngine.evaluate({
    drift: state.state?.drift ?? 0,
    failedExecutions: 0,
    chainDesync: false,
  })

  if (circuitBreakerEngine.getMode() === "LOCKDOWN") return

  organismSnapshotLock.lock(state.state)

  const intent = executionIntentQueue.getNext()

  if (!intent) return

  executionIntentQueue.updateStatus(intent.id, "PENDING")

  try {
    const result = await executionEngine.execute(intent)

    executionIntentQueue.updateStatus(intent.id, "EXECUTED")

    circuitBreakerEngine.evaluate({
      drift: state.state?.drift ?? 0,
      failedExecutions: 0,
      chainDesync: false,
    })

    await reconciliationEngine.reconcile(intent.fromUserId)

    this.updateOrganismFeedback(state, result)

  } catch (err) {

    executionIntentQueue.updateStatus(intent.id, "BLOCKED")

    circuitBreakerEngine.evaluate({
      drift: state.state?.drift ?? 0,
      failedExecutions: 1,
      chainDesync: false,
    })
  }
}

  private updateOrganismFeedback(_state: any, _result: any) {
    // reserved cognition loop
  }
}

export const treasuryRuntimeLoop = new AXPTTreasuryRuntimeLoop()
