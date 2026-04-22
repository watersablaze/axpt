export type UserTrustState = {
  totalEvents: number

  successCount: number
  failureCount: number

  successRate: number
  failureRate: number

  avgRisk: number

  lastEvaluatedAt: string | null
}

export type UserTrustScore = {
  score: number        // 0 → 100
  tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'ELITE'
}