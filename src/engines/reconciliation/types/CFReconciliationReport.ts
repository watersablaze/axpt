export type CFReconciliationReport = {
  ledger: {
    isHealthy: boolean
    driftScore: number
  }

  escrow: {
    isHealthy: boolean
  }

  doubleEntry: {
    isHealthy: boolean
  }

  reconstructedBalances: {
    key: string
    value: string
  }[]

  timestamp: number
}