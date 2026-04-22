import { prisma } from '@/infrastructure/db/prisma'

type ThreatNode = {
  id: string
  riskScore: number
  anomalyScore: number
  trustScore: number
}

type ThreatEdge = {
  from: string
  to: string
  weight: number
  suspicious: boolean
}

type ThreatComputationResult = Map<string, number>

function getNumericMeta(meta: Record<string, unknown>, key: string, fallback = 0) {
  const value = meta[key]
  return typeof value === 'number' ? value : fallback
}

export async function computeThreatField(): Promise<ThreatComputationResult> {
  const [users, edges] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        metadata: true,
      },
    }),
    prisma.userTrustEdge.findMany({
      select: {
        fromUserId: true,
        toUserId: true,
        transferCount: true,
        failedCount: true,
        trustScore: true,
      },
    }),
  ])

  const nodes = new Map<string, ThreatNode>()
  const adjacency = new Map<string, ThreatEdge[]>()

  for (const user of users) {
    const meta = (user.metadata as Record<string, unknown> | null) ?? {}

    nodes.set(user.id, {
      id: user.id,
      riskScore: getNumericMeta(meta, 'riskScore', 0),
      anomalyScore: getNumericMeta(meta, 'anomalyScore', 0),
      trustScore: getNumericMeta(meta, 'trustScore', 0),
    })
  }

  for (const edge of edges) {
    const mapped: ThreatEdge = {
      from: edge.fromUserId,
      to: edge.toUserId,
      weight: Math.max(1, edge.transferCount),
      suspicious: edge.failedCount > 0 || edge.trustScore < 0,
    }

    if (!adjacency.has(mapped.from)) adjacency.set(mapped.from, [])
    if (!adjacency.has(mapped.to)) adjacency.set(mapped.to, [])

    adjacency.get(mapped.from)!.push(mapped)
    adjacency.get(mapped.to)!.push({
      from: mapped.to,
      to: mapped.from,
      weight: mapped.weight,
      suspicious: mapped.suspicious,
    })
  }

  const field = new Map<string, number>()

  for (const [userId, node] of nodes.entries()) {
    // Local seed
    const localThreat =
      node.riskScore * 0.55 +
      node.anomalyScore * 0.35 +
      Math.max(0, 50 - node.trustScore) * 0.10

    let propagatedThreat = 0

    const firstHop = adjacency.get(userId) ?? []

    for (const edge1 of firstHop) {
      const neighbor = nodes.get(edge1.to)
      if (!neighbor) continue

      const neighborSeed =
        neighbor.riskScore * 0.5 +
        neighbor.anomalyScore * 0.4 +
        Math.max(0, 50 - neighbor.trustScore) * 0.1

      const edgeAmplifier =
        Math.log1p(edge1.weight) * (edge1.suspicious ? 1.35 : 1)

      // First hop influence
      propagatedThreat += neighborSeed * edgeAmplifier * 0.22

      // Second hop influence with decay
      const secondHop = adjacency.get(edge1.to) ?? []
      for (const edge2 of secondHop) {
        if (edge2.to === userId) continue

        const neighbor2 = nodes.get(edge2.to)
        if (!neighbor2) continue

        const neighbor2Seed =
          neighbor2.riskScore * 0.5 +
          neighbor2.anomalyScore * 0.4 +
          Math.max(0, 50 - neighbor2.trustScore) * 0.1

        const secondEdgeAmplifier =
          Math.log1p(edge2.weight) * (edge2.suspicious ? 1.2 : 1)

        propagatedThreat += neighbor2Seed * edgeAmplifier * secondEdgeAmplifier * 0.08
      }
    }

    const totalThreat = localThreat + propagatedThreat

    field.set(userId, Number(totalThreat.toFixed(4)))
  }

  return field
}