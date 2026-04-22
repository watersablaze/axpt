import { prisma } from '@/infrastructure/db/prisma'
import { buildIntentContextKey } from './intentContextKey'

export async function getIntentWeights(args: {
  intent: string
  assetCode?: string
  systemState?: string
}) {
  const key = buildIntentContextKey(args)
  const safeAssetCode = args.assetCode ?? 'GLOBAL'

  let profile = await prisma.intentWeightProfile.findUnique({
    where: {
      intent_assetCode_systemState: {
        intent: args.intent,
        assetCode: safeAssetCode,
        systemState: key.systemState,
      },
    },
  })

  if (!profile) {
    profile = await prisma.intentWeightProfile.create({
      data: key,
    })
  }

  return profile
}

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

  const lr = 0.05

  if (args.success) successWeight += lr
  else successWeight -= lr

  impactWeight += args.impactScore * lr

  // normalize
  let total = successWeight + impactWeight + patternWeight

  successWeight /= total
  impactWeight /= total
  patternWeight /= total

  // cap pattern influence
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
