// src/components/panels/contracts/controlCenter.ts

export type ControlCenterSnapshot = {
  timestamp: number

  system: {
    health: number
    drift: number
    stability: number
    status: 'STABLE' | 'WATCH' | 'DEGRADED' | 'CRITICAL'
  }

  execution: {
    pending: number
    successRate: number
    activeJobs: number
  }

  treasury: {
    pendingActions: number
    queuedExecutions: number
    failedExecutions: number
  }

  reconciliation: {
    driftScore: number
    anomalies: number
    lastSync: number | null
  }

  chain: {
    network: string
    latestIndexedBlock: string | null
    lagSeconds: number | null
  }

  governance: {
    riskScore: number
    activeLocks: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  }

  authority: {
    mode: 'SHADOW' | 'ENFORCED'
    lastDecision: string | null
  }
}