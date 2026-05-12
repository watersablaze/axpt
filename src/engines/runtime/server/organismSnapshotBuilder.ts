import { reconciliationEngine } from "@/engines/runtime/serverSingletons"

export async function buildOrganismSnapshot(entityId = "global") {
  const reconciliation = await reconciliationEngine.reconcileSignal(entityId)
  const payload = reconciliation.payload as {
    driftScore?: number
    anomalies?: string[]
  } | undefined
  const driftScore = payload?.driftScore ?? reconciliation.severity
  const anomalies = payload?.anomalies ?? []

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
      anomalies: anomalies.length,
    },

    governance: {
      riskScore: 0.12,
      activeLocks: 1,
      riskLevel: driftScore > 0.1 ? "HIGH" : "LOW",
    },
  }
}
