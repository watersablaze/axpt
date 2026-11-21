// src/components/panels/contracts/controlCenter.ts

export type ControlCenterSnapshot = {
  timestamp: number

  system: {
    health: number | null
    drift: number | null
    stability: number | null
    status: 'UNKNOWN' | 'STABLE' | 'WATCH' | 'DEGRADED' | 'CRITICAL'
  }

  execution: {
    pending: number
    successRate: number | null
    activeJobs: number | null
  }

  treasury: {
    pendingActions: number
    queuedExecutions: number
    failedExecutions: number
  }

  reconciliation: {
    driftScore: number | null
    anomalies: number | null
    lastSync: number | null
  }

  chain: {
    network: string
    latestIndexedBlock: string | null
    lagSeconds: number | null
  }

  governance: {
    riskScore: number | null
    activeLocks: number | null
    riskLevel: 'UNKNOWN' | 'LOW' | 'MEDIUM' | 'HIGH'
  }

  authority: {
    mode: 'SHADOW' | 'ENFORCED'
    lastDecision: string | null
  }
}