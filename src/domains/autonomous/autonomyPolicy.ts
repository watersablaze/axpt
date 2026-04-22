import { GOVERNOR_CONFIG } from '@/domains/predictive/governorConfig'

export function canAutoExecute({
  confidence,
  risks,
  systemState,
}: {
  confidence: number
  risks: { level: string }[]
  systemState: string
}) {
  const hasHighRisk = risks.some((r) => r.level === 'HIGH')

  if (systemState === 'PAUSED') return false
  if (systemState === 'RESTRICTED') return false
  if (confidence < 0.7) return false
  if (hasHighRisk) return false

  return true
}