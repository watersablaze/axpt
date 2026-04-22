import { prisma } from "@/lib/prisma"

type NextAction = {
  caseId: string
  caseTitle: string
  gateId: string
  gateName: string
  gateType: string
  responsibleRole: string
  actionLabel: string
}

type Gate = {
  id: string
  name: string
  gateType: string
  status: string
}

export async function getNextActions(): Promise<NextAction[]> {

  const cases = await prisma.case.findMany({
    where: {
      status: "OPEN"
    },
    include: {
      gates: {
        orderBy: {
          ord: "asc"
        }
      }
    }
  })

  const actions: NextAction[] = []

  for (const c of cases) {

    const gates = c.gates as unknown as Gate[]

    const nextGate = gates.find((g) => g.status !== "COMPLETED")

    if (!nextGate) continue

    const responsibleRole = getResponsibleRole(nextGate.gateType)
    const actionLabel = getActionLabel(nextGate.name)

    actions.push({
      caseId: c.id,
      caseTitle: c.title,
      gateId: nextGate.id,
      gateName: nextGate.name,
      gateType: nextGate.gateType,
      responsibleRole,
      actionLabel
    })
  }

  return actions
}

function getResponsibleRole(gateType: string): string {

  switch (gateType) {

    case "ARTIFACT_REQUIRED":
      return "PARTNER"

    case "SIGNATURE_REQUIRED":
      return "SIGNATORY"

    case "ESCROW_LOCK":
      return "TREASURY"

    case "ORACLE_CHECK":
      return "SYSTEM"

    default:
      return "VERIFIER"
  }
}

function getActionLabel(gateName: string): string {
  return `Complete: ${gateName}`
}