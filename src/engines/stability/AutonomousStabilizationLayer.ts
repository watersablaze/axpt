import { FinancialConsciousnessLoop } from '../memory/FinancialConsciousnessLoop'
import { GovernanceCortex } from '../governance/GovernanceCortex'

type StabilityMode =
  | 'NORMAL'
  | 'ELEVATED_RISK'
  | 'LOCKDOWN'
  | 'RECOVERY'

export class AutonomousStabilizationLayer {
  private mode: StabilityMode = 'NORMAL'

  constructor(
    private loop: FinancialConsciousnessLoop,
    private cortex: GovernanceCortex
  ) {}

  /**
   * MAIN ENTRY: SYSTEM HEALTH EVALUATION
   */
  evaluate(systemSnapshot: {
    riskScore: number
    disputeRate: number
    liquidityStress: number
  }) {
    const severity = this.calculateSeverity(systemSnapshot)

    this.applyMode(severity)

    this.enforcePolicies(severity)

    return {
      mode: this.mode,
      severity,
    }
  }

  /**
   * RISK SCORING ENGINE
   */
  private calculateSeverity(snapshot: any) {
    const score =
      snapshot.riskScore * 0.5 +
      snapshot.disputeRate * 0.3 +
      snapshot.liquidityStress * 0.2

    return Math.min(1, score)
  }

  /**
   * MODE SELECTION
   */
  private applyMode(severity: number) {
    if (severity > 0.8) {
      this.mode = 'LOCKDOWN'
    } else if (severity > 0.6) {
      this.mode = 'ELEVATED_RISK'
    } else if (severity > 0.3) {
      this.mode = 'RECOVERY'
    } else {
      this.mode = 'NORMAL'
    }
  }

  /**
   * SYSTEM BEHAVIOR MODULATION
   */
  private enforcePolicies(severity: number) {
    switch (this.mode) {
      case 'LOCKDOWN':
        this.cortex.evolve({
          type: 'RISK_SPIKE',
          intensity: 1,
        })

        this.cortex.evolve({
          type: 'SETTLEMENT_FAILURE_PATTERN',
          intensity: 0.9,
        })
        break

      case 'ELEVATED_RISK':
        this.cortex.evolve({
          type: 'TRANSFER_ANOMALY',
          intensity: severity,
        })
        break

      case 'RECOVERY':
        this.cortex.evolve({
          type: 'RISK_SPIKE',
          intensity: severity * 0.3,
        })
        break
    }
  }

  /**
   * PUBLIC STATE
   */
  getMode() {
    return this.mode
  }
}