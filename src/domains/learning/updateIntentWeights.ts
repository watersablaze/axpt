import { prisma } from '@/infrastructure/db/prisma'
import { getIntentWeights } from './intentWeights'
import { computeTimeDecayWeight } from './timeDecay'

export async function updateIntentWeights(args: {
  intent: string
  assetCode?: string
  systemState?: string
  success: boolean
  impactScore: number
}) {
  const profile = await getIntentWeights({
    intent: args.intent,
    assetCode: args.assetCode,
    systemState: args.systemState,
  })

  let {
    successWeight,
    impactWeight,
    patternWeight,
    sampleCount,
  } = profile

  // 🔥 Recency-sensitive learning rate
  const recencyWeight = computeTimeDecayWeight(new Date())
  const lr = 0.05 * recencyWeight

  if (args.success) successWeight += lr
  else successWeight -= lr

  impactWeight += args.impactScore * lr

  // normalize
  let total = successWeight + impactWeight + patternWeight

  successWeight /= total
  impactWeight /= total
  patternWeight /= total

  // guardrail
  patternWeight = Math.min(patternWeight, 0.4)

  await prisma.intentWeightProfile.update({
    where: { id: profile.id },
    data: {
      successWeight,
      impactWeight,
      patternWeight,
      sampleCount: sampleCount + 1,
    },
  })
}