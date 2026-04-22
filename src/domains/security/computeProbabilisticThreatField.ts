import { prisma } from '@/infrastructure/db/prisma'

type ThreatNode = {
  userId: string
  baseThreat: number
  propagatedThreat: number
  finalThreat: number
}

export async function computeProbabilisticThreatField() {
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
        trustScore: true,
        transferCount: true,
        failedCount: true,
      },
    }),
  ])

  // ──────────────────────────────
  // 1. Initialize base threat
  // ──────────────────────────────

  const nodeMap = new Map<string, ThreatNode>()

  for (const u of users) {
    const meta = (u.metadata as any) ?? {}

    const risk = Number(meta.riskScore ?? 0)
    const anomaly = Number(meta.anomalyScore ?? 0)
    const trust = Number(meta.trustScore ?? 0)

    const baseThreat =
      risk * 0.5 +
      anomaly * 6 -
      trust * 0.2

    nodeMap.set(u.id, {
      userId: u.id,
      baseThreat,
      propagatedThreat: 0,
      finalThreat: baseThreat,
    })
  }

  // ──────────────────────────────
  // 2. Propagation step (diffusion)
  // ──────────────────────────────

  for (const edge of edges) {
    const from = nodeMap.get(edge.fromUserId)
    const to = nodeMap.get(edge.toUserId)

    if (!from || !to) continue

    const interactionStrength =
      Math.log1p(edge.transferCount) +
      edge.failedCount * 1.5

    const trustPenalty =
      edge.trustScore < 0 ? 1.5 : 1

    const propagationFactor =
      interactionStrength * trustPenalty

    const influence =
      from.baseThreat * propagationFactor * 0.08

    to.propagatedThreat += influence
  }

  // ──────────────────────────────
  // 3. Final threat synthesis
  // ──────────────────────────────

  for (const node of nodeMap.values()) {
    node.finalThreat =
      node.baseThreat +
      node.propagatedThreat
  }

  return Array.from(nodeMap.values())
}