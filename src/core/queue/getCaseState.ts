import { prisma } from "@/lib/prisma"
import { CaseState } from "./state"
import type { Case, Gate, Artifact } from "@prisma/client"

type CaseWithRelations = Case & {
  gates: Gate[]
  artifacts: Artifact[]
  escrow: { status?: string } | null
}

export async function getCaseStates(): Promise<CaseState[]> {
  const cases: CaseWithRelations[] = await prisma.case.findMany({
    include: {
      gates: true,
      artifacts: true,
      escrow: true,
    },
  })

  return cases.map((c: CaseWithRelations) => {
    const gates = c.gates || []

    const pending = gates.filter((g: Gate) => g.status === "PENDING").length
    const verified = gates.filter((g: Gate) => g.status === "VERIFIED").length
    const signaturePending = gates.filter(
      (g: Gate) => g.gateType === "SIGNATURE" && g.status === "PENDING"
    ).length

    const artifacts = c.artifacts || []

    return {
      caseId: c.id,

      caseStatus: c.status,
      escrowStatus: c.escrow?.status ?? null,

      gates: {
        total: gates.length,
        pending,
        verified,
        signaturePending,
      },

      artifacts: {
        required: artifacts.length,
        submitted: artifacts.filter((a: Artifact) => a.url).length,
      },

      // keep simple for now
      risk: 5,
      urgency: 5,
    }
  })
}