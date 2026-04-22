import { prisma } from "@/lib/prisma"

export async function evaluateCaseGates(caseId: string) {

  const gates = await prisma.gate.findMany({
    where: {
      caseId,
      status: "PENDING"
    },
    orderBy: {
      ord: "asc"
    }
  })

  return gates
}