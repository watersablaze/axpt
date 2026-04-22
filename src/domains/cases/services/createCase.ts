// src/domains/cases/services/createCase.ts

import { prisma } from "@/lib/prisma"
import type { PrismaClient } from "@prisma/client"

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>

type CreateCaseInput = {
  title: string
  description?: string
  jurisdiction?: string
  referenceCode?: string
  workflowType?: string
  mode?: string
  createdById?: string
}

export async function createCase(input: CreateCaseInput) {
  const title = input.title?.trim()

  if (!title) {
    throw new Error("Case title is required")
  }

  const workflowType = input.workflowType ?? "COORDINATION"
  const mode = input.mode ?? "COORDINATION_ONLY"

  const result = await prisma.$transaction(async (tx: Tx) => {

    const caseRecord = await tx.case.create({
      data: {
        title,
        description: input.description?.trim() || null,
        jurisdiction: input.jurisdiction?.trim() || null,
        referenceCode: input.referenceCode?.trim() || null,
        workflowType,
        mode,
        status: "DRAFT",
        createdById: input.createdById ?? null,
      },
    })

    await tx.domainEvent.create({
      data: {
        streamType: "CASE",
        streamId: caseRecord.id,
        eventType: "CASE_CREATED",
        payload: {
          caseId: caseRecord.id,
          title: caseRecord.title,
          workflowType: caseRecord.workflowType,
          mode: caseRecord.mode,
          createdById: caseRecord.createdById,
        },
      },
    })

    return caseRecord
  })

  return result
}