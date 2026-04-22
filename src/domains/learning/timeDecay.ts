export function computeTimeDecayWeight(createdAt: Date): number {
  const now = Date.now()
  const ageMs = now - new Date(createdAt).getTime()

  const ageHours = ageMs / (1000 * 60 * 60)

  // decay curve (tunable)
  const halfLife = 24 // hours

  const weight = Math.exp(-ageHours / halfLife)

  return Math.max(0.1, weight) // never fully zero
}