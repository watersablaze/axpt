import { prisma } from "@/infrastructure/db/prisma"
import { emitCaseEvent } from "../events/caseEventBus"

export async function activateNextGate(caseId: string) {

  const nextGate = await prisma.gate.findFirst({
    where: {
      caseId,
      status: "PENDING"
    },
    orderBy: {
      ord: "asc"
    }
  })

  if (!nextGate) return null

  const updatedGate = await prisma.gate.update({
    where: {
      id: nextGate.id
    },
    data: {
      activatedAt: new Date()
    }
  })

  await emitCaseEvent({
    name: "GATE_ACTIVATED",
    payload: {
      caseId,
      gateId: nextGate.id
    },
    occurredAt: new Date().toISOString()
  })

  return updatedGate
}


export async function verifyGate(
  gateId: string,
  actorUserId?: string
) {

  const gate = await prisma.gate.findUnique({
    where: { id: gateId }
  })

  if (!gate) {
    throw new Error("Gate not found")
  }

  if (gate.status !== "PENDING") {
    throw new Error("Gate already resolved")
  }

  const updatedGate = await prisma.gate.update({
    where: { id: gateId },
    data: {
      status: "VERIFIED",
      resolvedAt: new Date()
    }
  })

  await emitCaseEvent({
    name: "GATE_VERIFIED",
    payload: {
      caseId: gate.caseId,
      gateId: gate.id,
      actorUserId
    },
    occurredAt: new Date().toISOString()
  })

  await activateNextGate(gate.caseId)

  return updatedGate
}


export async function rejectGate(
  gateId: string,
  actorUserId?: string
) {

  const gate = await prisma.gate.findUnique({
    where: { id: gateId }
  })

  if (!gate) {
    throw new Error("Gate not found")
  }

  const updatedGate = await prisma.gate.update({
    where: { id: gateId },
    data: {
      status: "REJECTED",
      resolvedAt: new Date()
    }
  })

  await emitCaseEvent({
    name: "GATE_REJECTED",
    payload: {
      caseId: gate.caseId,
      gateId: gate.id,
      actorUserId
    },
    occurredAt: new Date().toISOString()
  })

  return updatedGate
}