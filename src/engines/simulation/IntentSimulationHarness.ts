import { runtimeBus } from "@/engines/runtime/serverSingletons"
import { executionStream } from "@/engines/runtime/ExecutionStreamCore"
import { executionTraceLedger } from "@/engines/trace/ExecutionTraceLedger"
import { executionGraph } from "@/engines/graph/ExecutionGraphEngine"
import { reconciliationEngine } from "@/engines/runtime/serverSingletons"
import { buildOrganismSnapshot } from "@/engines/runtime/server/organismSnapshotBuilder"
import { executionGovernance } from "@/engines/governance/ExecutionGovernanceLayer"

type SimulationIntent = {
  type: string
  amount?: number
  wallet?: string
  to?: string
  escrowId?: string
  metadata?: Record<string, any>
}

export class IntentSimulationHarness {
  private running = false

  /**
   * 🧪 FULL SYSTEM SIMULATION ENTRY POINT
   */
  async simulateIntent(intent: SimulationIntent) {
    if (this.running) {
      throw new Error("Simulation already running")
    }

    this.running = true

    const simulationId = crypto.randomUUID()

    executionTraceLedger.append({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: "SIMULATION_STARTED",
      payload: intent,
      metadata: { simulationId },
    })

    executionGraph.addNode({
      id: simulationId,
      type: "SIMULATION_ROOT",
      timestamp: Date.now(),
      data: intent,
    })

    try {
      /**
       * 1. Inject intent into system
       */
      runtimeBus.emit(intent)

      /**
       * 2. Allow execution stream to process
       * (we do not manually step engines—true system test)
       */
      await this.waitForPropagation()

      /**
       * 3. Pull final system snapshot
       */
      const snapshot = await buildOrganismSnapshot()

      /**
       * 4. Governance evaluation
       */
      const decision = executionGovernance.evaluate({
  ...snapshot,
  divergence,
})

      /**
       * 5. Reconciliation sanity check
       */
      const reconciliation = await reconciliationEngine.reconcile("SIMULATION")

      /**
       * 6. Final trace write
       */
      executionTraceLedger.append({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: "SIMULATION_COMPLETE",
        payload: {
          intent,
          snapshot,
          decision,
          reconciliation,
        },
        metadata: {
          simulationId,
        },
      })

      return {
        simulationId,
        snapshot,
        decision,
        reconciliation,
      }
    } finally {
      this.running = false
    }
  }

  /**
   * ⏱ allow async pipelines to settle
   * (executionStream, graph writes, etc.)
   */
  private waitForPropagation(ms = 300) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export const intentSimulationHarness = new IntentSimulationHarness()