import { prisma } from "@/lib/prisma"
import { emitCaseEvent } from "@/domains/cases/events/caseEventBus"

export async function lockEscrow(caseId: string) {

  const escrow = await prisma.escrow.create({
    data: {
      caseId,
      status: "LOCKED"
    }
  })

  await emitCaseEvent({
    name: "ESCROW_LOCKED",
    payload: {
      caseId
    },
    occurredAt: new Date().toISOString()
  })

  return escrow
}


export async function releaseEscrow(caseId: string) {

  const escrow = await prisma.escrow.update({
    where: {
      caseId
    },
    data: {
      status: "RELEASED"
    }
  })

  await emitCaseEvent({
    name: "ESCROW_RELEASED",
    payload: {
      caseId
    },
    occurredAt: new Date().toISOString()
  })

  await prisma.ledgerEntry.create({
  data: {
    accountId: "escrow",
    direction: "DEBIT",
    tokenType: "USDC",
    chainId: 1,
  }
})

  return escrow
}