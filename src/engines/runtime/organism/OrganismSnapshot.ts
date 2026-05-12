export type OrganismSnapshot = {
  timestamp: number

  system: {
    health: number
    drift: number
    stability: number
  }

  execution: {
    pending: number
    successRate: number
  }

  reconciliation: {
    lastSync: number
    anomalies: number
  }

  governance: {
    riskScore: number
    activeLocks: number
  }
}