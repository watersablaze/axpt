import { prisma } from "@/lib/prisma"
import {
  getRiskScore,
  getUrgencyScore,
  getValueScore,
} from "./scoring"

type QueueItemShape = {
  id: string
  caseId: string
  type: string
  status: string
  priorityScore: number
  urgency: number
  risk: number
  value: number
  blocking: boolean
  assignedTo?: string | null
  escalated: boolean
  createdAt: string
}

export async function buildPriorityQueue(): Promise<QueueItemShape[]> {
  const cases = await prisma.case.findMany()

  console.log("RAW CASES", cases.length)

  const queue: QueueItemShape[] = []

  for (const c of cases) {
    const baseRisk = getRiskScore(c)
    const urgency = getUrgencyScore(c)
    const value = getValueScore(c)

    const isEscalated = urgency >= 8 && baseRisk >= 8

    const priorityScore =
      urgency * 0.5 +
      baseRisk * 0.3 +
      value * 0.2 +
      (isEscalated ? 5 : 0)

    queue.push({
      id: `${c.id}-action`,
      caseId: c.id,
      type: "STATE_DRIVEN",
      status: c.status,
      priorityScore,
      urgency,
      risk: baseRisk,
      value,
      blocking: true,
      assignedTo: null,
      escalated: isEscalated,
      createdAt: new Date().toISOString(),
    })
  }

  const sorted = queue.sort((a, b) => b.priorityScore - a.priorityScore)

// ⚠️ TEMP: disable persistence to prevent DB overload
// queue will be computed only

  return sorted
}