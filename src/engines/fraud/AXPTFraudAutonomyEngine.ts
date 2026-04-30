import { MemoryGraphEngine } from '../memory/MemoryGraphEngine'

export class AXPTFraudAutonomyEngine {
  constructor(private memory: MemoryGraphEngine) {}

  /**
   * 🧠 REAL-TIME FRAUD DETECTION
   */
  async evaluate(entityId: string) {
    const state = await this.memory.trace(entityId)

    const anomalies = this.detectAnomalies(state)

    return {
      riskLevel: this.score(anomalies),
      flags: anomalies,
      action: this.decide(anomalies),
    }
  }

  private detectAnomalies(events: any[]) {
    const anomalies: string[] = []

    const highVelocity = events.length > 50
    const inconsistentTransfers = events.filter(e => e.type === 'TRANSFER').length % 2 !== 0

    if (highVelocity) anomalies.push('HIGH_VELOCITY_ACTIVITY')
    if (inconsistentTransfers) anomalies.push('TRANSFER_IMBALANCE')

    return anomalies
  }

  private score(anomalies: string[]) {
    return Math.min(1, anomalies.length * 0.4)
  }

  private decide(anomalies: string[]) {
    if (anomalies.length > 2) return 'BLOCK'
    if (anomalies.length === 2) return 'ESCROW'
    return 'ALLOW'
  }
}