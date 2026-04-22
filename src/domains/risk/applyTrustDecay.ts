export function applyTrustDecay(params: {
  trustScore: number
  lastUpdatedAt: Date
}) {
  const { trustScore, lastUpdatedAt } = params

  const now = Date.now()
  const last = new Date(lastUpdatedAt).getTime()

  const hours = (now - last) / (1000 * 60 * 60)

  // 🔥 Decay curve
  const decayRate = 0.02 // 2% per hour

  const decayFactor = Math.exp(-decayRate * hours)

  return trustScore * decayFactor
}