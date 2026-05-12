import { MemoryGraphEngine } from '@/engines/memory/MemoryGraphEngine'
import { ExecutionGovernorV2 } from '@/engines/governance/ExecutionGovernorV2'
import { AXPTDigitalTwinEngine } from '@/engines/twin/AXPTDigitalTwinEngine'

export type ReplayRequest = {
  entityId: string
  timestamp: number
}

export type ReplayResult = {
  entityId: string
  timestamp: number

  reconstructedState: any
  governanceDecision: any
  twinSnapshot: any

  explanation: string[]
}

export class GovernanceReplayEngine {
  constructor(
    private memory: MemoryGraphEngine,
    private governor: ExecutionGovernorV2,
    private twin: AXPTDigitalTwinEngine
  ) {}

  /**
   * 🧠 MAIN REPLAY FUNCTION (DETERMINISTIC)
   */
  async replay(req: ReplayRequest): Promise<ReplayResult> {
    const { entityId, timestamp } = req

    /**
     * ──────────────────────────────
     * 1. EVENT-BASED RECONSTRUCTION (TRUTH)
     * ──────────────────────────────
     */
    const reconstructedState = await this.memory.replay(
      entityId,
      timestamp
    )

    /**
     * ──────────────────────────────
     * 2. TWIN SIMULATION (STATE AT TIME T)
     * ──────────────────────────────
     */
    const twinSnapshot = await this.twin.simulate({
      transfer: reconstructedState.transactions?.at(-1),
    })

    /**
     * ──────────────────────────────
     * 3. GOVERNANCE RE-EVALUATION
     * (IMPORTANT: PURE SIMULATION ONLY)
     * ──────────────────────────────
     */
    const governanceDecision = await this.governor.evaluate({
      req: {
        idempotencyKey: `REPLAY-${entityId}-${timestamp}`,
        fromUserId: entityId,
        toUserId: 'REPLAY',
        assetCode: 'AXG',
        amountBaseUnits: BigInt(0),
        metadata: {
          replay: true,
          timestamp,
        },
      },
      ctx: {
        fromUserId: entityId,
        toUserId: 'REPLAY',
        assetCode: 'AXG',
        amountBaseUnits: BigInt(0),
        escrowId: undefined,
      },
      twin: twinSnapshot,
      risk: {
        score: 0,
        level: 'LOW',
        reasons: ['REPLAY_MODE'],
      },
    })

    /**
     * ──────────────────────────────
     * 4. EXPLANATION TRACE
     * ──────────────────────────────
     */
    const explanation = this.buildExplanation(
      reconstructedState,
      twinSnapshot,
      governanceDecision
    )

    return {
      entityId,
      timestamp,
      reconstructedState,
      twinSnapshot,
      governanceDecision,
      explanation,
    }
  }

  /**
   * 🧠 CAUSAL EXPLANATION LAYER
   */
  private buildExplanation(state: any, twin: any, decision: any) {
    return [
      `Reconstructed transactions: ${state.transactions?.length ?? 0}`,
      `Twin stress at time slice: ${twin.stressScore}`,
      `Governance decision: ${decision.decision}`,
    ]
  }
}