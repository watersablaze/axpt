import { MemoryGraphEngine } from '@/engines/memory/MemoryGraphEngine'
import { ReconciliationEngine } from '@/engines/reconciliation/ReconciliationEngine'
import { GovernanceMutationEngine } from '@/engines/governance/mutations/GovernanceMutationEngine'
import { GovernanceMutationLedger } from './mutations/GovernanceMutationLedger'

export type GovernanceProfile = {
  riskHigh: number
  riskMid: number
  twinThreshold: number
  driftTolerance: number
}

export type EvolutionResult = {
  updatedProfile: GovernanceProfile
  driftTrend: number
  instabilityScore: number
  adjustments: string[]
}

export class GovernanceEvolutionEngine {
  constructor(
    private memory: MemoryGraphEngine,
    private reconciliation: ReconciliationEngine,
    private mutationEngine = new GovernanceMutationEngine(),
    private ledger = new GovernanceMutationLedger()
  ) {}

  /**
   * 🧠 MAIN EVOLUTION LOOP
   */
  async evolve(entityId: string): Promise<EvolutionResult> {
    /**
     * 1. LOAD SYSTEM HISTORY
     */
    const history = await this.memory.trace(entityId)

    /**
     * 2. RUN RECONCILIATION OVER TIME WINDOW
     */
    const recon = await this.reconciliation.reconcile(entityId)

    /**
     * 3. COMPUTE DRIFT TREND (system stability over time)
     */
    const driftTrend = this.computeDriftTrend(history)

    /**
     * 4. SYSTEM INSTABILITY SCORE
     */
    const instabilityScore = this.computeInstability(recon, driftTrend)

    /**
     * 5. BASE GOVERNANCE PROFILE
     */
    const profile = this.loadCurrentProfile()
    const previousProfile = { ...profile }

    /**
     * 6. APPLY CONTROLLED MUTATIONS
     */
    const mutation = this.mutationEngine.mutate(profile, {
      driftScore: recon.driftScore,
      anomalyFrequency: recon.anomalies.length,
      instabilityScore,
      history,
    })

    this.ledger.record({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      previousProfile,
      newProfile: mutation.updatedProfile,
      trigger:
        instabilityScore > 0.7
          ? 'SELF_HEAL'
          : driftTrend > 0.2
          ? 'DRIFT'
          : 'ANOMALY',
      driftScore: recon.driftScore,
      anomalyCount: recon.anomalies.length,
      instabilityScore,
      mutations: mutation.mutations,
      sourceEngine: 'GovernanceEvolutionEngine',
    })

    /**
     * 7. RETURN EVOLUTION RESULT
     */
    return {
      updatedProfile: mutation.updatedProfile,
      driftTrend,
      instabilityScore,
      adjustments: [
        ...this.describeChanges(previousProfile, mutation.updatedProfile),
        ...mutation.mutations,
      ],
    }
  }

  /**
   * ──────────────────────────────
   * DRIFT ANALYSIS
   * ──────────────────────────────
   */
  private computeDriftTrend(history: any[]): number {
    if (history.length < 10) return 0

    const recent = history.slice(-10)
    const older = history.slice(-20, -10)

    const recentDrift = this.avgDrift(recent)
    const olderDrift = this.avgDrift(older)

    return recentDrift - olderDrift
  }

  private avgDrift(events: any[]): number {
    if (!events.length) return 0
    return (
      events.reduce((sum, e) => sum + (e.metadata?.driftScore ?? 0), 0) /
      events.length
    )
  }

  /**
   * ──────────────────────────────
   * INSTABILITY MODEL
   * ──────────────────────────────
   */
  private computeInstability(recon: any, driftTrend: number): number {
    return Math.min(
      1,
      recon.driftScore * 0.6 + Math.abs(driftTrend) * 0.4
    )
  }

  /**
   * ──────────────────────────────
   * GOVERNANCE PROFILE LOADER
   * ──────────────────────────────
   */
  private loadCurrentProfile(): GovernanceProfile {
    return {
      riskHigh: 0.85,
      riskMid: 0.6,
      twinThreshold: 0.7,
      driftTolerance: 0.05,
    }
  }

  /**
   * ──────────────────────────────
   * CONTROLLED EVOLUTION ENGINE
   * ──────────────────────────────
   */
  private adjustProfile(
    profile: GovernanceProfile,
    instability: number,
    driftTrend: number
  ): GovernanceProfile {
    const adjustmentFactor = instability * 0.1

    return {
      riskHigh: this.clamp(profile.riskHigh - adjustmentFactor),
      riskMid: this.clamp(profile.riskMid - adjustmentFactor / 2),
      twinThreshold: this.clamp(profile.twinThreshold + adjustmentFactor),
      driftTolerance: this.clamp(
        profile.driftTolerance + driftTrend * 0.1
      ),
    }
  }

  private clamp(value: number) {
    return Math.max(0.1, Math.min(0.95, value))
  }

  /**
   * ──────────────────────────────
   * HUMAN-READABLE EVOLUTION TRACE
   * ──────────────────────────────
   */
  private describeChanges(
    oldP: GovernanceProfile,
    newP: GovernanceProfile
  ): string[] {
    const changes: string[] = []

    if (oldP.riskHigh !== newP.riskHigh) {
      changes.push('riskHigh adjusted due to instability')
    }

    if (oldP.driftTolerance !== newP.driftTolerance) {
      changes.push('driftTolerance adapted to system behavior')
    }

    return changes
  }
}
