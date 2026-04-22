import { prisma } from "@/lib/prisma"

type EscrowWithCase = {
  id: string
  caseId: string
  createdAt: Date
  status: string
  case: {
    title: string
  }
}

export async function getEscrowRisk() {

  const escrows = await prisma.escrow.findMany({
    include: {
      case: {
        select: {
          title: true
        }
      }
    }
  })

  const now = Date.now()

  return (escrows as EscrowWithCase[]).map((e) => {

    const ageHours =
      (now - new Date(e.createdAt).getTime()) / 3600000

    let risk = "LOW"

    if (ageHours > 72) risk = "HIGH"
    else if (ageHours > 24) risk = "MEDIUM"

    return {
      id: e.id,
      caseId: e.caseId,
      caseTitle: e.case.title,
      ageHours,
      risk,
      status: e.status
    }
  })
}