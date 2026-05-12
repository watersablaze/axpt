import { breathEngine } from '@/engines/runtime/serverSingletons'
import type { OrganismStream } from '@/engines/runtime/AXPTBreathEngine'
import type { CFReconciliationReport } from '@/engines/reconciliation/types/CFReconciliationReport'
import { ReconciliationEngine } from '@/engines/reconciliation/ReconciliationEngine'
import { GovernanceMutationLedger } from '@/engines/governance/mutations/GovernanceMutationLedger'

/**
 * 🧬 AXPT ORGANISM FIELD ENGINE
 * 
 * Synthesis layer:
 * - BreathEngine (physiological state)
 * - ReconciliationEngine (system truth validation)
 * - MutationLedger (historical evolution memory)
 * 
 * This does NOT execute logic.
 * It OBSERVES + SHAPES perception only.
 */

export type OrganismFieldSnapshot = {
  timestamp: number

  // core organs
  treasury: OrganismStream
  governance: OrganismStream
  risk: OrganismStream

  // system-wide coherence
  globalDrift: number
  globalStability: number
  globalIntensity: number

  // system diagnostics
  ledgerMutations: number
  reconciliationDrift: number
  anomalies: number[]

  // narrative layer (for UI cognition rendering)
  systemNarrative: string
}

export class AXPTOrganismFieldEngine {
  constructor(
    private reconciliation: ReconciliationEngine,
    private ledger: GovernanceMutationLedger
  ) {}

  /**
   * 🧠 PRIMARY FIELD SYNTHESIS
   */
  async getField(): Promise<OrganismFieldSnapshot> {
    const breath = breathEngine.getOrganismStream()
    const recon = await this.reconciliation.runFullReconciliation()
    const mutationCount = this.ledger.getHistory().length

    const baseDrift = recon.ledger.driftScore ?? 0

    /**
     * 🫀 ORGAN DERIVATION MODEL
     * (all organs are transformations of ONE stream)
     */
    const treasury = breath

    const governance: OrganismStream = {
      ...breath,
      intensity: breath.intensity * 1.15,
      drift: breath.drift * 0.85,
    }

    const risk: OrganismStream = {
      ...breath,
      intensity: breath.intensity * 1.25,
      drift: breath.drift * 1.4,
    }

    /**
     * 🧬 SYSTEM METRICS
     */
    const globalDrift = baseDrift
    const globalStability = Math.max(0, 1 - baseDrift)
    const globalIntensity = breath.intensity

    /**
     * 🧠 SYSTEM NARRATIVE ENGINE (UI COGNITION LAYER)
     */
    const systemNarrative = this.generateNarrative({
      drift: globalDrift,
      intensity: globalIntensity,
      mutations: mutationCount,
    })

    return {
      timestamp: Date.now(),

      treasury,
      governance,
      risk,

      globalDrift,
      globalStability,
      globalIntensity,

      ledgerMutations: mutationCount,
      reconciliationDrift: baseDrift,
      anomalies: recon.ledger ? [] : [],

      systemNarrative,
    }
  }

  /**
   * 🧠 SIMPLE COGNITIVE INTERPRETER
   * (this will later become AI-driven)
   */
  private generateNarrative(input: {
    drift: number
    intensity: number
    mutations: number
  }): string {
    const { drift, intensity, mutations } = input

    if (drift > 0.7) {
      return 'System instability rising. Organism entering corrective tension.'
    }

    if (mutations > 50 && intensity > 0.6) {
      return 'High evolutionary activity detected across governance layers.'
    }

    if (intensity < 0.3) {
      return 'System at rest. Low metabolic governance activity.'
    }

    return 'System stable. Continuous low-level adaptation in progress.'
  }
}
