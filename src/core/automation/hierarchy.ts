export function buildHierarchy(powerIndex: Record<string, number>) {
  const sorted = Object.entries(powerIndex)
    .sort((a, b) => b[1] - a[1])

  const max = sorted[0]?.[1] || 1

  return sorted.map(([id, power]) => {
    const ratio = power / max

    let tier = "LOW"

    if (ratio > 0.85) tier = "DOMINANT"
    else if (ratio > 0.65) tier = "INFLUENCER"
    else if (ratio > 0.45) tier = "PARTICIPANT"

    return {
      operatorId: id,
      power,
      tier,
    }
  })
}