// src/core/automation/distrust.ts

type Input = {
  successRate?: number
  trustScore?: number
}

export function computeDistrustFactor(input: Input): number {
  const reputation = input.successRate ?? 1
  const trust = input.trustScore ?? 1

  // =========================
  // HARD DISTRUST
  // =========================
  if (reputation < 0.4 && trust < 0.5) {
    return 0.5 // heavily dampened
  }

  // =========================
  // MODERATE DISTRUST
  // =========================
  if (reputation < 0.6 || trust < 0.7) {
    return 0.75
  }

  // =========================
  // HEALTHY
  // =========================
  return 1
}