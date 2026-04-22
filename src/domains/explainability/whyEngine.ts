import type { IntentType } from '@/domains/intent/intentTypes'

export type WhyExplanation = {
  intent: IntentType
  summary: string
  factors: string[]
  metrics?: Record<string, number>
}

export function buildIntentWhy(args: {
  intent: IntentType
  reasoning?: string[]
  systemState?: string
  assetCode?: string
}): WhyExplanation {
  const { intent, reasoning = [], systemState, assetCode } = args

  const factors = [...reasoning]

  if (systemState) {
    factors.push(`System state: ${systemState}`)
  }

  if (assetCode) {
    factors.push(`Scope: ${assetCode}`)
  }

  return {
    intent,
    summary: `System recommends ${intent}`,
    factors,
  }
}