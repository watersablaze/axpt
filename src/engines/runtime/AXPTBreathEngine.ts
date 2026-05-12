import type { AXPTEvent, AXPTEventBus } from '@/engines/events/AXPTEventBus'
import { GovernanceMutationLedger } from '@/engines/governance/mutations/GovernanceMutationLedger'
import { ReconciliationEngine } from '@/engines/reconciliation/ReconciliationEngine'
import type { OrganismState } from './AXPTOrganismStateModel'

export type BreathState = {
  phase: 'INHALE' | 'HOLD' | 'DECAY' | 'EXHALE'
  intensity: number
  drift: number
  mutations: number
  timestamp: number
}

export type OrganismStream = {
  phase: 'INHALE' | 'HOLD' | 'DECAY' | 'EXHALE'
  drift: number
  intensity: number
  mutations: number
  stability: number
  timestamp: number
}

export class AXPTBreathEngine {
  private observedEvents = new Set<AXPTEvent['type']>([
    'TRANSFER_EXECUTED',
    'EXECUTION_FINALIZED',
    'COHERENCE_BLOCKED',
    'GOVERNANCE_EVALUATION_COMPLETED',
  ])


  private state: BreathState = {
    phase: 'EXHALE',
    intensity: 0,
    drift: 0,
    mutations: 0,
    timestamp: Date.now(),
  }

  private organism: OrganismStream = {
    phase: 'EXHALE',
    drift: 0,
    intensity: 0,
    mutations: 0,
    stability: 1,
    timestamp: Date.now(),
  }

  constructor(
    private bus: AXPTEventBus,
    private reconciliation: ReconciliationEngine,
    private ledger: GovernanceMutationLedger
  ) {
    this.bind()
  }

  /**
   * 🫁 SYSTEM SUBSCRIPTION LAYER
   */
  private bind() {
    this.bus.subscribe((event) => {
      if (!this.observedEvents.has(event.type)) return

      void this.tickFromEvent(event)
    })
  }

  tick(type: AXPTEvent['type'], payload?: any) {
    void this.tickFromEvent({ type, payload } as AXPTEvent)
  }

  /**
   * 🫁 CORE BREATH UPDATE LOOP
   */
  private async tickFromEvent(event: AXPTEvent) {
    const recon = await this.reconciliation.runFullReconciliation()
    const mutations = this.ledger.getHistory().length

    const drift = recon.ledger.driftScore

    this.organism = {
      phase: this.computePhase(event.type),
      drift,
      intensity: this.computeIntensity(drift),
      mutations,
      stability: 1 - drift,
      timestamp: Date.now(),
    }

    this.state = {
      phase: this.organism.phase,
      intensity: this.organism.intensity,
      drift: this.organism.drift,
      mutations: this.organism.mutations,
      timestamp: this.organism.timestamp,
    }
  }

  /**
   * 🌬 PHASE LOGIC (SYSTEM BREATH)
   */
  private computePhase(type: string): BreathState['phase'] {
    if (type.includes('EXECUTE')) return 'INHALE'
    if (type.includes('FINALIZED')) return 'EXHALE'
    if (type.includes('COHERENCE')) return 'HOLD'
    return 'DECAY'
  }

  /**
   * 🔥 INTENSITY = SYSTEM STRESS VISUALIZATION
   */
  private computeIntensity(drift: number): number {
    return Math.min(1, drift * 1.5)
  }

  /**
   * 📡 EXTERNAL STATE ACCESS
   */
  getState(): BreathState {
    return this.state
  }

  getOrganismStream(): OrganismStream {
    return this.organism
  }

  getOrganismState(): OrganismState {
    return {
      breathPhase: this.state.phase,
      breathIntensity: this.state.intensity,
      drift: this.state.drift,

      stability: 1 - this.state.drift,
      mutationCount: this.state.mutations,
      evolutionPressure: this.state.mutations * this.state.drift,

      lastEvent: 'SYSTEM_PULSE',
      lastExecutionStatus: this.mapExecutionState(),

      timestamp: this.state.timestamp,
    }
  }

  private mapExecutionState(): 'SUCCESS' | 'FAILED' | 'BLOCKED' {
    if (this.state.drift > 0.7) return 'BLOCKED'
    if (this.state.drift > 0.3) return 'FAILED'
    return 'SUCCESS'
  }
}
