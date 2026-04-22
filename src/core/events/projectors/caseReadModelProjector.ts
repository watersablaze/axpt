import { prisma } from "@/lib/prisma"
import { deriveCaseStage } from "@/lib/cases/phaseEngine"
import { runStageAutomation } from "@/core/automation/stageAutomation"

type DomainEventRecord = {
  eventType: string
  streamId: string
  payload: any
  metadata?: any
}

export async function projectCaseReadModel(event: DomainEventRecord) {
  const caseId = event.streamId || event.payload?.caseId
  if (!caseId) return

  // Guardrail 1: do not let automation-emitted events re-trigger automation
  const isAutomationEvent = event.metadata?.source === "automation"

  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      gates: {
        orderBy: { ord: "asc" },
      },
      Escrow: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  if (!caseRecord) return

  const events = await prisma.domainEvent.findMany({
    where: {
      streamType: "CASE",
      streamId: caseId,
    },
    orderBy: {
      occurredAt: "asc",
    },
  })

  const stage = deriveCaseStage(events)

  const nextGate = caseRecord.gates.find(
    (g: (typeof caseRecord.gates)[number]) => g.status === "PENDING"
  )

  const latestEscrow = caseRecord.Escrow[0]

  // Guardrail 2: compare previous stage to new stage
  const existing = await prisma.caseReadModel.findUnique({
    where: { caseId },
  })

  const previousStage = existing?.currentStage ?? null

  await prisma.caseReadModel.upsert({
    where: { caseId: caseRecord.id },
    update: {
      title: caseRecord.title,
      status: caseRecord.status,
      workflowType: caseRecord.workflowType,
      currentStage: stage,
      currentGateName: nextGate?.name ?? null,
      nextActionLabel: nextGate ? `Complete: ${nextGate.name}` : null,
      responsibleRole: nextGate
        ? resolveRoleForGateType(nextGate.gateType)
        : null,
      escrowStatus: latestEscrow?.status ?? null,
    },
    create: {
      caseId: caseRecord.id,
      title: caseRecord.title,
      status: caseRecord.status,
      workflowType: caseRecord.workflowType,
      currentStage: stage,
      currentGateName: nextGate?.name ?? null,
      nextActionLabel: nextGate ? `Complete: ${nextGate.name}` : null,
      responsibleRole: nextGate
        ? resolveRoleForGateType(nextGate.gateType)
        : null,
      escrowStatus: latestEscrow?.status ?? null,
      createdAt: caseRecord.createdAt,
    },
  })

  // Guardrail 3: only automate on real stage changes, and never from automation-originated events
  if (!isAutomationEvent && previousStage !== stage) {
    await runStageAutomation(caseId, stage)
  }
}

function resolveRoleForGateType(gateType: string | null | undefined) {
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