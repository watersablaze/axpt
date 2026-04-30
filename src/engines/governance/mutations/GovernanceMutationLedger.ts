import type { GovernanceProfile } from '../GovernanceEvolutionEngine'

export type GovernanceMutationEvent = {
  id: string

  timestamp: number

  previousProfile: GovernanceProfile
  newProfile: GovernanceProfile

  trigger:
    | 'DRIFT'
    | 'ANOMALY'
    | 'SELF_HEAL'
    | 'TWIN_SIGNAL'
    | 'MANUAL'

  driftScore: number
  anomalyCount: number
  instabilityScore: number

  mutations: string[]

  sourceEngine: string
}

export class GovernanceMutationLedger {
  private ledger: GovernanceMutationEvent[] = []

  /**
   * 🧬 RECORD MUTATION EVENT
   */
  record(event: GovernanceMutationEvent) {
    this.ledger.push(event)
  }

  /**
   * 📜 GET FULL EVOLUTION HISTORY
   */
  getHistory() {
    return this.ledger
  }

  /**
   * 🧠 GET LATEST GOVERNANCE STATE
   */
  getLatestProfile(): GovernanceProfile | null {
    return this.ledger.at(-1)?.newProfile ?? null
  }

  /**
   * 📊 ANALYTICS LAYER
   */
  getMutationStats() {
    return {
      totalMutations: this.ledger.length,

      driftTriggered: this.ledger.filter(
        (e) => e.trigger === 'DRIFT'
      ).length,

      anomalyTriggered: this.ledger.filter(
        (e) => e.trigger === 'ANOMALY'
      ).length,

      selfHealingTriggered: this.ledger.filter(
        (e) => e.trigger === 'SELF_HEAL'
      ).length,
    }
  }
}