import { AXPTBreathEngine } from './AXPTBreathEngine'
import { ReconciliationEngine } from '@/engines/reconciliation/ReconciliationEngine'
import { GovernanceMutationLedger } from '@/engines/governance/mutations/GovernanceMutationLedger'
import { LedgerReplayEngine } from '@/engines/replay/LedgerReplayEngine'

export type SystemPulseStream = {
  thought: string
  reasoning: string[]
  phase: string
  intensity: number
  liquidity: number
  treasuryFlow: number
  executionPressure: number
  drift: number
  systemStress: number
  health: number
  mutationCount: number
  lastDecision?: string
  timestamp: number
}

export class AXPTUnifiedPulseEngine {
  constructor(
    private breath: AXPTBreathEngine,
    private reconciliation: ReconciliationEngine,
    private ledger: GovernanceMutationLedger,
    private replay: LedgerReplayEngine
  ) {}

  /**
   * 🧬 SINGLE SOURCE OF SYSTEM TRUTH (LIVE)
   */
  async getPulse(caseId?: string): Promise<SystemPulseStream> {
    const breathState = this.breath.getState()
    const recon = await this.reconciliation.runFullReconciliation()
    const ledgerHistory = this.ledger.getHistory()
    const replayState = await this.replay.replay(caseId)

    /**
     * ──────────────────────────────
     * ORGANISM (THOUGHT LAYER)
     * ──────────────────────────────
     */
    const thought = this.computeThought(
      breathState.drift,
      breathState.phase
    )

    const reasoning = [
      `drift=${breathState.drift.toFixed(3)}`,
      `mutations=${ledgerHistory.length}`,
      `replayEvents=${replayState.transfers.length}`,
    ]

    /**
     * ──────────────────────────────
     * TREASURY LAYER (FLOW SYSTEM)
     * ──────────────────────────────
     */
    const liquidity = replayState.liquidityIndex
    const treasuryFlow =
      replayState.transfers.length +
      replayState.escrows.length

    const executionPressure = recon.ledger.driftScore

    /**
     * ──────────────────────────────
     * SYSTEM HEALTH LAYER
     * ──────────────────────────────
     */
    const systemStress = recon.ledger.driftScore
    const health = Math.max(0, 1 - systemStress)

    return {
      // cognition
      thought,
      reasoning,

      // physiology
      phase: breathState.phase,
      intensity: breathState.intensity,

      // treasury
      liquidity,
      treasuryFlow,
      executionPressure,

      // stability
      drift: breathState.drift,
      systemStress,
      health,

      // governance memory
      mutationCount: ledgerHistory.length,
      lastDecision: ledgerHistory.at(-1)?.trigger,

      timestamp: Date.now(),
    }
  }

  /**
   * 🧠 SYSTEM CONSCIOUSNESS INTERPRETER
   */
  private computeThought(drift: number, phase: string): string {
    if (drift > 0.7) return 'System is under coordinated stress response'
    if (drift > 0.4) return 'System is recalibrating financial coherence'
    if (phase === 'INHALE') return 'System is absorbing execution load'
    if (phase === 'EXHALE') return 'System is stabilizing after resolution'
    return 'System is in low cognitive activity state'
  }
}
