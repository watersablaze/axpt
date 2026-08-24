import type { TransactionClient } from "@prisma/client";

import { loadTransferCapacityAssessmentWithClient } from "../../transfer-capacity-assessments/persistence/loadTransferCapacityAssessmentWithClient";

import { loadTreasuryTransferWithClient } from "../../transfers/persistence/loadTreasuryTransferWithClient";

import { TREASURY_TRANSFER_STATUS } from "../../transfers/status";

import { recordTreasuryExecutionPlan } from "../recordTreasuryExecutionPlan";

import { persistNewTreasuryExecutionPlanWithClient } from "../persistence/persistNewTreasuryExecutionPlanWithClient";

import type { PersistedNewTreasuryExecutionPlan } from "../persistence/contracts";

import type { RecordTreasuryExecutionPlanDurably } from "./recordTreasuryExecutionPlanDurablyContracts";

export async function recordTreasuryExecutionPlanDurablyWithClient(params: {
  request: RecordTreasuryExecutionPlanDurably;

  client: TransactionClient;
}): Promise<PersistedNewTreasuryExecutionPlan> {
  const { request, client } = params;

  const loadedTransfer = await loadTreasuryTransferWithClient({
    transferId: request.payload.transferId,

    client,
  });

  if (!loadedTransfer) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_NOT_FOUND] ${request.payload.transferId}`,
    );
  }

  if (
    loadedTransfer.aggregate.status !==
    TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED
  ) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_TRANSFER_STATUS_INVALID] ${loadedTransfer.aggregate.status}`,
    );
  }

  const loadedCapacityAssessment =
    await loadTransferCapacityAssessmentWithClient({
      assessmentId: request.payload.capacityAssessmentId,

      client,
    });

  if (!loadedCapacityAssessment) {
    throw new Error(
      `[TREASURY_GATEWAY_TRANSFER_CAPACITY_ASSESSMENT_NOT_FOUND] ${request.payload.capacityAssessmentId}`,
    );
  }

  const result = recordTreasuryExecutionPlan({
    planId: request.planId,

    capacityAssessment: loadedCapacityAssessment.aggregate,

    command: {
      context: request.context,

      payload: request.payload,
    },
  });

  return persistNewTreasuryExecutionPlanWithClient({
    result,

    eventId: request.eventId,

    context: request.context,

    client,
  });
}
