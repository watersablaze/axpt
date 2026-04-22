export function getOperatorArchetype(profile: any) {
  if (!profile || profile.totalDecisions < 3) {
    return "UNDEFINED"
  }

  const approveRate =
    profile.approveCount / profile.totalDecisions

  const overrideRate =
    profile.overrideCount / profile.totalDecisions

  if (overrideRate > 0.4) return "ASSERTIVE"
  if (approveRate > 0.7) return "TRUSTING"
  if (profile.delayCount / profile.totalDecisions > 0.4)
    return "CAUTIOUS"

  return "BALANCED"
}