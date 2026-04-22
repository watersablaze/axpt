import { prisma } from "@/lib/prisma"

type HeatmapRow = {
  label: string
  count: number
}

export async function getCaseHeatmap(): Promise<HeatmapRow[]> {
  const cases = await prisma.case.findMany({
    include: {
      gates: {
        orderBy: { ord: "asc" }
      }
    }
  })

  const buckets = new Map<string, number>()

  for (const c of cases) {
  const nextGate = c.gates.find((g: (typeof c.gates)[number]) => g.status === "PENDING")

    const label =
      nextGate?.gateType === "ARTIFACT_REQUIRED"
        ? "Waiting on Artifact"
        : nextGate?.gateType === "SIGNATURE_REQUIRED"
        ? "Waiting on Signature"
        : nextGate?.gateType === "ESCROW_LOCK"
        ? "Waiting on Escrow"
        : c.status

    buckets.set(label, (buckets.get(label) ?? 0) + 1)
  }

  return Array.from(buckets.entries()).map(([label, count]) => ({
    label,
    count
  }))
}