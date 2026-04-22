import { GOVERNOR_CONFIG } from '@/domains/predictive/governorConfig'

export function canAutonomouslyExecute(args: {
  governorState: string
  confidence: number
  risks: { level: string }[]
  intent: string
}) {
  const { governorState, confidence, risks, intent } = args

  const hasHighRisk = risks.some((r) => r.level === 'HIGH')

  if (governorState === 'PAUSED') {
    return {
      allowed: false,
      reason: 'Governor is PAUSED',
    }
  }

  if (governorState === 'RESTRICTED') {
    return {
      allowed: false,
      reason: 'Governor is RESTRICTED; autonomy downgraded to advisory',
    }
  }

  if (confidence < GOVERNOR_CONFIG.minAutoExecuteConfidence) {
    return {
      allowed: false,
      reason: `Confidence too low (${confidence.toFixed(2)})`,
    }
  }

  if (hasHighRisk) {
    return {
      allowed: false,
      reason: 'Scenario contains HIGH risk',
    }
  }

  if (!['STABILIZE_SYSTEM', 'PREPARE_SETTLEMENT', 'RESUME_SAFE'].includes(intent)) {
    return {
      allowed: false,
      reason: `Intent ${intent} is not autonomy-approved`,
    }
  }

  return {
    allowed: true,
    reason: 'Autonomous execution permitted',
  }
}