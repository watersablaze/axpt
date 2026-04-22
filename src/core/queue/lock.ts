import { prisma } from "@/lib/prisma"

export async function acquireLock(caseId: string, operatorId: string) {
  const existing = await prisma.queueLock.findFirst({
    where: {
      caseId,
      expiresAt: {
        gt: new Date(),
      },
    },
  })

  if (existing) {
    return {
      ok: false,
      lockedBy: existing.operatorId,
    }
  }

  await prisma.queueLock.create({
    data: {
      caseId,
      operatorId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  })

  await prisma.queueItem.updateMany({
    where: { caseId },
    data: {
      assignedTo: operatorId,
      status: "CLAIMED",
    },
  })

  await prisma.queueHistory.create({
    data: {
      caseId,
      action: "CLAIM",
      operatorId,
      metadata: {
        source: "queue-lock",
      },
    },
  })

  return { ok: true }
}

export async function releaseLock(caseId: string, operatorId: string) {
  await prisma.queueLock.deleteMany({
    where: {
      caseId,
      operatorId,
    },
  })

  await prisma.queueItem.updateMany({
    where: { caseId },
    data: {
      assignedTo: null,
      status: "PENDING",
    },
  })

  await prisma.queueHistory.create({
    data: {
      caseId,
      action: "RELEASE",
      operatorId,
      metadata: {
        source: "queue-lock",
      },
    },
  })

  return { ok: true }
}