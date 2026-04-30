import { prisma } from "@/lib/prisma"
import type { TransactionClient } from "@prisma/client"
import { GOLD_SPA_V1 } from "@/lib/templates/goldSpaV1"
import { appendDomainEvent } from "@/core/events/appendDomainEvent"
import { EventTypes } from "@/core/events/types"
import { Prisma } from "@prisma/client"

const TEMPLATE_NAME = "GOLD_SPA_V1"
const SYSTEM_ACTOR = "SYSTEM"

function assertGoldSpaTemplate() {
  if (!GOLD_SPA_V1.defaults) {
    throw new Error(`${TEMPLATE_NAME} defaults are missing`)
  }

  if (!Array.isArray(GOLD_SPA_V1.gates)) {
    throw new Error(`${TEMPLATE_NAME} must define at least one gate`)
  }

  if (!Array.isArray(GOLD_SPA_V1.requiredArtifacts)) {
    throw new Error(`${TEMPLATE_NAME} must define at least one required artifact`)
  }
}

async function runPostInit(caseId: string) {
  try {
    await Promise.all([
      appendDomainEvent({
        streamType: "CASE",
        streamId: caseId,
        eventType: EventTypes.CASE_CREATED,
        payload: {
          actor: SYSTEM_ACTOR,
          template: TEMPLATE_NAME,
        },
      }),
      appendDomainEvent({
        streamType: "CASE",
        streamId: caseId,
        eventType: EventTypes.GATES_INITIALIZED,
        payload: {
          actor: SYSTEM_ACTOR,
          gateCount: GOLD_SPA_V1.gates.length,
        },
      }),
      appendDomainEvent({
        streamType: "CASE",
        streamId: caseId,
        eventType: EventTypes.ARTIFACTS_REQUIRED,
        payload: {
          actor: SYSTEM_ACTOR,
          artifactCount: GOLD_SPA_V1.requiredArtifacts.length,
        },
      }),
      prisma.queueHistory.create({
        data: {
          caseId,
          action: "CASE_INITIALIZED",
          operatorId: SYSTEM_ACTOR,
          metadata: {
            workflow: "GOLD_SPA",
            source: "createGoldSpaCase",
          },
        },
      }),
    ])
  } catch (error) {
    console.error("[createGoldSpaCase] post-init failed", { caseId, error })
  }
}

export async function createGoldSpaCase() {
  assertGoldSpaTemplate()

  const caseRecord = await prisma.$transaction(async (tx: any) => {

    // =========================
    // 🧾 CREATE CASE
    // =========================
    const c = await tx.case.create({
      data: {
        title: "Gold SPA — French-Ward / Bafoula",
        workflowType: "GOLD_SPA",
        mode: "GOLD_SPA_PROTOCOL",
        protocolTemplate: TEMPLATE_NAME,

        commodity: GOLD_SPA_V1.defaults.commodity,
        commodityForm: GOLD_SPA_V1.defaults.commodityForm,
        originCountry: GOLD_SPA_V1.defaults.originCountry,
        purityText: GOLD_SPA_V1.defaults.purityText,
        caratsText: GOLD_SPA_V1.defaults.caratsText,
        pricingFormula: GOLD_SPA_V1.defaults.pricingFormula,
        currency: GOLD_SPA_V1.defaults.currency,
        titleTransferRule: GOLD_SPA_V1.defaults.titleTransferRule,

        status: "DRAFT",
        isPrincipalBuyerCase: true,
        automationEnabled: true,
      },
    })

    // =========================
    // 👥 PARTIES
    // =========================
    await tx.party.createMany({
      data: [
        {
          caseId: c.id,
          role: "SELLER",
          entityName: "COOPÉRATIVE DE BAFOULABE MALI",
          authorizedSignatory: "Authorized Seller Rep",
        },
        {
          caseId: c.id,
          role: "BUYER",
          entityName: "French-Ward Inc.",
          authorizedSignatory: "Authorized Buyer Rep",
        },
        {
          caseId: c.id,
          role: "INTERNAL_OPERATOR",
          entityName: "French-Ward Operations",
        },
      ],
    })

    // =========================
    // 🚪 GATES
    // =========================
    await tx.gate.createMany({
      data: GOLD_SPA_V1.gates.map((g) => ({
        caseId: c.id,
        name: g.name,
        gateType: g.gateType,
        ord: g.ord,
        status: "PENDING",
      })),
    })

    // =========================
    // 📦 ARTIFACTS
    // =========================
    await tx.artifact.createMany({
      data: GOLD_SPA_V1.requiredArtifacts.map((type) => ({
        caseId: c.id,
        type,
        name: type,
        status: "MISSING",
      })),
    })

    return c
  })

  await runPostInit(caseRecord.id)

  return caseRecord
}
