import { prisma } from "@/infrastructure/db/prisma"

export async function getGateQueue() {

  const gates = await prisma.gate.findMany({

    where: {
      status: "PENDING"
    },

    include: {
      case: true
    },

    orderBy: {
      createdAt: "asc"
    }

  })

  return gates

}