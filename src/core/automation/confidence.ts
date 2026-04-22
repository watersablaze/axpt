export function computeOperatorConfidence(profile: any) {
  if (!profile || profile.totalDecisions === 0) {
    return 0.5 // neutral baseline
  }

  const approveRate =
    profile.approveCount / profile.totalDecisions

  const overrideRate =
    profile.overrideCount / profile.totalDecisions

  // 🔥 weighted confidence model
  const confidence =
    approveRate * 0.7 + (1 - overrideRate) * 0.3

  return Math.max(0, Math.min(1, confidence))
}