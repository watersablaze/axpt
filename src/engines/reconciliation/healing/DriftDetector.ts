// src/engines/reconciliation/healing/DriftDetector.ts

export class DriftDetector {
  classify(report: any) {
    const issues = []

    if (!report.doubleEntry.isHealthy) {
      issues.push({
        type: 'LEDGER_IMBALANCE',
        severity: 'CRITICAL',
      })
    }

    if (!report.escrow.isHealthy) {
      issues.push({
        type: 'ESCROW_STATE_DRIFT',
        severity: 'CRITICAL',
      })
    }

    return issues
  }
}