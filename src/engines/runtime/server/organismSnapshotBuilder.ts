import { reconciliationEngine } from "@/engines/runtime/serverSingletons"

export async function buildOrganismSnapshot(entityId = "global") {
  const reconciliation =
    await reconciliationEngine.reconcileSignal(entityId)

  const driftScore = reconciliation.severity

  return {
    timestamp: Date.now(),

    system: {
      health: 0.92,
      drift: 0.1,
      stability: 0.88,
    },

    execution: {
      pending: 3,
      successRate: 0.97,
    },

    reconciliation: {
      lastSync: Date.now(),
      driftScore,
      anomalies: driftScore > 0.1 ? 1 : 0,
    },

    governance: {
      riskScore: 0.12,
      activeLocks: 1,
      riskLevel: driftScore > 0.1 ? "HIGH" : "LOW",
    },
  }
}
