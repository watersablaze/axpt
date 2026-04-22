import { prisma } from "@/lib/prisma"

const ESCALATION_MINUTES = 10

export async function runEscalation() {
  const now = new Date()

  const locks = await prisma.queueLock.findMany()

  for (const lock of locks) {
    const ageMs = now.getTime() - lock.acquiredAt.getTime()

    if (ageMs > ESCALATION_MINUTES * 60 * 1000) {
      // 🔥 escalation triggered

      await prisma.queueLock.delete({
        where: { id: lock.id },
      })

      await prisma.domainEvent.create({
        data: {
          streamType: "CASE",
          streamId: lock.caseId,
          eventType: "ESCALATED",
          payload: {
            reason: "Lock expired",
            previousOperator: lock.operatorId,
          },
        },
      })
    }
  }
}