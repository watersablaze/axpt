import { buildTransferGraph } from './buildTransferGraph'

export async function computeClusterScore(userId: string) {
  const edges = await buildTransferGraph(60)

  const outgoing = edges.filter((e) => e.from === userId)
  const incoming = edges.filter((e) => e.to === userId)

  const counterparties = new Set([
    ...outgoing.map((e) => e.to),
    ...incoming.map((e) => e.from),
  ])

  let score = 0
  const reasons: string[] = []

  if (counterparties.size >= 5) {
    score += 2
    reasons.push('HIGH_COUNTERPARTY_DENSITY')
  }

  const repeatedLoops = edges.filter(
    (e) =>
      counterparties.has(e.from) &&
      counterparties.has(e.to) &&
      e.count > 2
  )

  if (repeatedLoops.length >= 3) {
    score += 3
    reasons.push('REPEATED_CLUSTER_ACTIVITY')
  }

  return { score, reasons }
}