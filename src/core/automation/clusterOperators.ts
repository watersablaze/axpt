type OperatorNode = {
  operatorId: string
  name: string
  trustScore?: number
}

type TrustEdge = {
  from: string
  to: string
  trustScore: number
}

export function clusterOperators(
  operators: OperatorNode[],
  edges: TrustEdge[]
) {
  const clusters: Record<string, string[]> = {}

  for (const op of operators) {
    clusters[op.name] = [op.name]
  }

  for (const edge of edges) {
    if (edge.trustScore > 0.85) {
      clusters[edge.from] = Array.from(
        new Set([
          ...(clusters[edge.from] || []),
          edge.to,
        ])
      )
    }
  }

  // collapse duplicates
  const uniqueClusters: string[][] = []

  Object.values(clusters).forEach((group) => {
    const exists = uniqueClusters.some(
      (g) =>
        g.length === group.length &&
        g.every((x) => group.includes(x))
    )

    if (!exists) uniqueClusters.push(group)
  })

  return uniqueClusters
}