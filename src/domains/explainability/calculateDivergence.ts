export function calculateDivergence(args: {
  intentChanged: boolean
  addedFactors: string[]
  removedFactors: string[]
}) {
  let score = 0

  if (args.intentChanged) {
    score += 0.5
  }

  score += Math.min(args.addedFactors.length * 0.1, 0.25)
  score += Math.min(args.removedFactors.length * 0.1, 0.25)

  return Math.min(score, 1)
}