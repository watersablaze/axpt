import { buildTransferGraph } from './buildTransferGraph'

export async function detectMultiHopRisk(params: {
  fromUserId: string
  toUserId: string
}) {
  const { fromUserId, toUserId } = params
  const edges = await buildTransferGraph(60)

  const adjacency = new Map<string, Set<string>>()

  for (const edge of edges) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, new Set())
    adjacency.get(edge.from)!.add(edge.to)
  }

  let score = 0
  const reasons: string[] = []
  const relatedUsers = new Set<string>()

  const firstHop = adjacency.get(fromUserId) ?? new Set<string>()

  if (firstHop.has(toUserId)) {
    reasons.push('DIRECT_LINK')
    relatedUsers.add(toUserId)
  }

  let twoHopCount = 0
  for (const mid of firstHop) {
    const next = adjacency.get(mid)
    if (next?.has(toUserId)) {
      twoHopCount++
      relatedUsers.add(mid)
      relatedUsers.add(toUserId)
    }
  }

  if (twoHopCount >= 2) {
    score += 3
    reasons.push(`MULTI_HOP_2:${twoHopCount}`)
  }

  const targetInbound = edges.filter((e) => e.to === toUserId)
  const uniqueInboundSenders = new Set(targetInbound.map((e) => e.from))

  if (uniqueInboundSenders.size >= 3) {
    score += 4
    reasons.push(`TARGET_CLUSTER:${uniqueInboundSenders.size}`)

    for (const sender of uniqueInboundSenders) {
      relatedUsers.add(sender)
    }
    relatedUsers.add(toUserId)
  }

  return {
    score,
    reasons,
    metrics: {
      twoHopCount,
      sharedNeighborCount: uniqueInboundSenders.size,
    },
    relatedUsers: Array.from(relatedUsers),
  }
}