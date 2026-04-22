export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export function classifyRisk(score: number): RiskLevel {
  if (score >= 6) return 'HIGH'
  if (score >= 3) return 'MEDIUM'
  return 'LOW'
}