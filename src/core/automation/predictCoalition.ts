type Operator = {
  operatorId: string
  name: string
  decision?: "APPROVE" | "DELAY" | "OVERRIDE"
  trustScore?: number
}

export async function predictCoalitionsPersistent(
  operators: Operator[],
  prisma: any
) {
  const predictions: Record<string, number> = {}

  for (const op of operators) {
    if (!op.decision) continue

    let weight = op.trustScore ?? 1

    const alliances = await prisma.operatorAlliance.findMany({
      where: { operatorAId: op.operatorId },
    })

    for (const a of alliances) {
      const ratio =
        a.alignmentScore /
        (a.alignmentScore + a.disagreementScore || 1)

      weight *= 0.8 + ratio // amplify trusted alliances
    }

    predictions[op.decision] =
      (predictions[op.decision] || 0) + weight
  }

  const total =
    Object.values(predictions).reduce((a, b) => a + b, 0) || 1

  const normalized: Record<string, number> = {}

  for (const key in predictions) {
    normalized[key] = predictions[key] / total
  }

  return normalized
}