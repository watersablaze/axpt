export type GovernanceSignal =
  | 'RISK_SPIKE'
  | 'DISPUTE_CLUSTER'
  | 'TRANSFER_ANOMALY'
  | 'SETTLEMENT_FAILURE_PATTERN'

export type GovernancePolicy = {
  escrowThreshold: number
  transferRiskMultiplier: number
  settlementStrictness: number
  disputeSensitivity: number
}