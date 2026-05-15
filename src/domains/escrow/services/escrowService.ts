import { prisma } from "@/lib/prisma"
import { emitCaseEvent } from "@/domains/cases/events/caseEventBus"

type LockEscrowInput = {
  caseId: string
  amountBaseUnits: bigint | string | number
  assetCode: string
  fromWalletId: string
  toWalletId: string
}

export async function lockEscrow(input: LockEscrowInput) {
  const caseId = input.caseId
  const amountBaseUnits = input.amountBaseUnits.toString()
  const assetCode = input.assetCode
  const fromWalletId = input.fromWalletId
  const toWalletId = input.toWalletId

  const escrow = await prisma.escrow.create({
    data: {
      escrowId: crypto.randomUUID(),
      caseId,
      amountBaseUnits,
      assetCode,
      fromWalletId,
      toWalletId,
      status: "INITIATED",
      chainState: "PENDING",
      reconciliationState: "UNRECONCILED",
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


export async function releaseEscrow(escrowId: string) {
  const existing = await prisma.escrow.findUnique({
    where: { id: escrowId },
  })

  if (!existing) {
    throw new Error("ESCROW_NOT_FOUND")
  }

  const escrow = await prisma.escrow.update({
    where: {
      id: existing.id,
    },
    data: {
      status: "RELEASED"
    }
  })

  await emitCaseEvent({
    name: "ESCROW_RELEASED",
    payload: {
      caseId: existing.caseId
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
