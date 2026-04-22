type Args = {
  mismatchesBefore: number
  mismatchesAfter: number
  deadLettersBefore: number
  deadLettersAfter: number
  syncLagBefore: number
  syncLagAfter: number
}

export function computeImpactScore(args: Args): number {
  let score = 0

  // improvements
  if (args.mismatchesAfter < args.mismatchesBefore) score += 0.4
  if (args.deadLettersAfter < args.deadLettersBefore) score += 0.3
  if (args.syncLagAfter < args.syncLagBefore) score += 0.3

  // regressions
  if (args.mismatchesAfter > args.mismatchesBefore) score -= 0.4
  if (args.deadLettersAfter > args.deadLettersBefore) score -= 0.3
  if (args.syncLagAfter > args.syncLagBefore) score -= 0.3

  return Math.max(-1, Math.min(1, score))
}