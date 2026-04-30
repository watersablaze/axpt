type SystemModifiers = {
  escrowThreshold?: number
  transferRiskMultiplier?: number
  settlementStrictness?: number
}

export class FinancialConsciousnessLoop {
  private state: SystemModifiers = {
    escrowThreshold: 0.5,
    transferRiskMultiplier: 1,
    settlementStrictness: 1,
  }

  /**
   * MAIN FEEDBACK ENTRY
   */
  applyRiskSignal(signal: {
    entityId: string
    riskScore: number
    reason: string
  }) {
    this.adjustSystem(signal)
  }

  /**
   * CORE ADAPTATION LOGIC
   */
  private adjustSystem(signal: {
    riskScore: number
    reason: string
  }) {
    const { riskScore, reason } = signal

    switch (reason) {
      case 'TRANSFER_DEVIATION_SPIKE':
        this.state.transferRiskMultiplier = Math.min(
          3,
          (this.state.transferRiskMultiplier ?? 1) + riskScore
        )
        break

      case 'HIGH_DISPUTE_FREQUENCY':
        this.state.escrowThreshold = Math.min(
          0.9,
          (this.state.escrowThreshold ?? 0.5) + 0.1
        )
        break

      default:
        this.state.settlementStrictness =
          (this.state.settlementStrictness ?? 1) + riskScore * 0.1
    }
  }

  /**
   * USED BY TRANSFER ENGINE / ESCROW ENGINE
   */
  getState() {
    return this.state
  }
}
