// src/core/automation/reputation.ts

import { prisma } from "@/lib/prisma"

export async function updateOperatorReputation({
  operatorId,
  wasCorrect,
}: {
  operatorId: string
  wasCorrect: boolean
}) {
  const profile = await prisma.operatorProfile.findUnique({
    where: { operatorId },
  })

  if (!profile) return

  const now = new Date()

  // =========================
  // TIME + DECAY
  // =========================

  const lastUpdate =
    profile.lastUpdatedAt ?? profile.updatedAt ?? profile.createdAt

  const hoursSinceUpdate =
    (Date.now() - new Date(lastUpdate).getTime()) / 3600000

  // 🔥 smooth exponential decay
  const decayFactor = Math.exp(-hoursSinceUpdate / 72)

  // prevent collapse
  const decayedScore = Math.max(
    0.25,
    (profile.weightedScore ?? 1) * decayFactor
  )

  // =========================
  // UPDATE COUNTS
  // =========================

  const total = profile.totalDecisions + 1
  const correct =
    profile.correctDecisions + (wasCorrect ? 1 : 0)

  const accuracy = correct / total

  // =========================
  // BLENDED SCORE
  // =========================

  const newScore =
    decayedScore * 0.6 +
    accuracy * 0.4

  // =========================
  // OPTIONAL: TREND SIGNAL
  // =========================

  const delta = newScore - (profile.weightedScore ?? 1)

  const trend =
    delta > 0.05
      ? "RISING"
      : delta < -0.05
      ? "FALLING"
      : "STABLE"

  await prisma.operatorProfile.update({
    where: { operatorId },
    data: {
      totalDecisions: total,
      correctDecisions: correct,
      weightedScore: newScore,
      lastUpdatedAt: now,
    },
  })

  return {
    newScore,
    trend,
  }
}