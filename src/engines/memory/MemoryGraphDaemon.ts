import { MemoryGraphEngine } from './MemoryGraphEngine'
import { MemoryGraphQuery } from './MemoryGraphQuery'
import type { MemoryNode } from './MemoryGraphTypes'

type RiskSignal = {
  entityId: string
  riskScore: number
  reason: string
}

export class MemoryGraphDaemon {
  private graph = new MemoryGraphEngine()
  private query = new MemoryGraphQuery()

  /**
   * MAIN ENTRY: ingest + process + evaluate
   */
  async ingest(node: MemoryNode) {
    const stored = await this.graph.ingest(node)

    await this.process(node)

    return stored
  }

  /**
   * CORE PROCESSING PIPELINE
   */
  private async process(node: MemoryNode) {
    await Promise.all([
      this.detectAnomalies(node),
      this.updateCausalGraph(node),
      this.evaluateRisk(node),
    ])
  }

  /**
   * 1. ANOMALY DETECTION
   */
  private async detectAnomalies(node: MemoryNode) {
    if (node.type === 'TRANSFER' && node.delta?.amount) {
      const recent = await this.query.recentTransfers(node.entityId)

      const avg =
        recent.reduce((sum, n) => {
          return sum + Number(n.delta?.amount ?? 0)
        }, 0) / Math.max(recent.length, 1)

      const deviation =
        Math.abs(Number(node.delta.amount) - avg) / (avg || 1)

      if (deviation > 2.5) {
        await this.emitRiskSignal({
          entityId: node.entityId,
          riskScore: Math.min(1, deviation / 5),
          reason: 'TRANSFER_DEVIATION_SPIKE',
        })
      }
    }
  }

  /**
   * 2. CAUSAL LINK ENHANCEMENT
   */
  private async updateCausalGraph(node: MemoryNode) {
    // placeholder for future graph enrichment
    // (fraud chain linking, settlement lineage, etc.)
    return
  }

  /**
   * 3. RISK EVALUATION
   */
  private async evaluateRisk(node: MemoryNode) {
    const risky = await this.query.findRiskyChains(node.entityId)

    if (risky.length > 5) {
      await this.emitRiskSignal({
        entityId: node.entityId,
        riskScore: 0.9,
        reason: 'HIGH_DISPUTE_FREQUENCY',
      })
    }
  }

  /**
   * OUTPUT TO CONSCIOUSNESS LOOP
   */
  private async emitRiskSignal(signal: RiskSignal) {
    console.log('[RISK_SIGNAL]', signal)

    // in production: publish to event bus
    // bus.emit('RISK_SIGNAL', signal)
  }
}