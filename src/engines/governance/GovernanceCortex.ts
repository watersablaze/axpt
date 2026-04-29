import { FinancialConsciousnessLoop } from '../memory/FinancialConsciousnessLoop'

export class GovernanceCortex {
  private memoryLoop: FinancialConsciousnessLoop

  private policy = {
    escrowThreshold: 0.5,
    transferRiskMultiplier: 1,
    settlementStrictness: 1,
    disputeSensitivity: 0.5,
  }

  constructor(loop: FinancialConsciousnessLoop) {
    this.memoryLoop = loop
  }

  /**
   * MAIN ENTRY: SYSTEM OBSERVATION → POLICY EVOLUTION
   */
  evolve(signal: {
    type: string
    intensity: number
    entityId?: string
  }) {
    switch (signal.type) {
      case 'TRANSFER_ANOMALY':
        this.increaseTransferFriction(signal.intensity)
        break

      case 'DISPUTE_CLUSTER':
        this.increaseEscrowSensitivity(signal.intensity)
        break

      case 'RISK_SPIKE':
        this.hardenSystem(signal.intensity)
        break

      case 'SETTLEMENT_FAILURE_PATTERN':
        this.strengthenFinality(signal.intensity)
        break
    }

    this.syncToMemoryLoop()
  }

  /**
   * ESCALATE TRANSFER SAFETY
   */
  private increaseTransferFriction(intensity: number) {
    this.policy.transferRiskMultiplier = Math.min(
      5,
      this.policy.transferRiskMultiplier + intensity * 0.3
    )
  }

  /**
   * FORCE MORE ESCROW USAGE
   */
  private increaseEscrowSensitivity(intensity: number) {
    this.policy.escrowThreshold = Math.max(
      0.1,
      this.policy.escrowThreshold - intensity * 0.2
    )
  }

  /**
   * SYSTEM HARDENING (GLOBAL RISK MODE)
   */
  private hardenSystem(intensity: number) {
    this.policy.transferRiskMultiplier += intensity * 0.5
    this.policy.settlementStrictness += intensity * 0.3
  }

  /**
   * FINALITY HARDENING
   */
  private strengthenFinality(intensity: number) {
    this.policy.settlementStrictness = Math.min(
      10,
      this.policy.settlementStrictness + intensity * 0.4
    )
  }

  /**
   * PUSH POLICY BACK INTO SYSTEM CONSCIOUSNESS LOOP
   */
  private syncToMemoryLoop() {
    // this is where system becomes self-aware
    ;(this.memoryLoop as any).setPolicy?.(this.policy)
  }

  /**
   * PUBLIC ACCESS
   */
  getPolicy() {
    return this.policy
  }
}