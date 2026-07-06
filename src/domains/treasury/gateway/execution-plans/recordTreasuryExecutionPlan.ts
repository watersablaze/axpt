import { TREASURY_EVENT_TYPE } from "../events/eventType";

import {
  EXECUTABLE_TRANCHE_STATUS,
  TREASURY_EXECUTION_PLAN_STATUS,
} from "./status";

import { validateTreasuryExecutionPlan } from "./validateTreasuryExecutionPlan";

import type { TransferCapacityAssessment } from "../transfer-capacity-assessments/contracts";

import type { RecordTreasuryExecutionPlan } from "./commands";

import type { TreasuryExecutionPlan } from "./contracts";

import type { TreasuryExecutionPlanRecordedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

import type { TreasuryExecutionPlanId } from "../shared/identifiers";

export function recordTreasuryExecutionPlan(params: {
  planId: TreasuryExecutionPlanId;

  capacityAssessment: TransferCapacityAssessment;

  command: RecordTreasuryExecutionPlan;
}): TreasuryDomainResult<
  TreasuryExecutionPlan,
  TreasuryExecutionPlanRecordedPayload
> {
  const { planId, capacityAssessment, command } = params;

  const { context, payload } = command;

  if (payload.transferId !== capacityAssessment.transferId) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_TRANSFER_MISMATCH] ${payload.transferId} -> ${capacityAssessment.transferId}`,
    );
  }

  if (payload.capacityAssessmentId !== capacityAssessment.id) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_CAPACITY_ASSESSMENT_MISMATCH] ${payload.capacityAssessmentId} -> ${capacityAssessment.id}`,
    );
  }

  if (!capacityAssessment.executableNow) {
    throw new Error("[TREASURY_EXECUTION_PLAN_EXECUTABLE_CAPACITY_REQUIRED]");
  }

  validateTreasuryExecutionPlan({
    plannedAmount: payload.plannedAmount,

    executableNow: capacityAssessment.executableNow,

    tranches: payload.tranches,
  });

  const tranches = payload.tranches.map((tranche) => ({
    id: tranche.trancheId,

    sequence: tranche.sequence,

    amount: tranche.amount,

    executionKind: tranche.executionKind,

    allocationId: tranche.allocationId,

    instructionId: tranche.instructionId,

    beneficiaryProfileId: tranche.beneficiaryProfileId,

    settlementEndpointId: tranche.settlementEndpointId,

    purpose: tranche.purpose,

    status: EXECUTABLE_TRANCHE_STATUS.PLANNED,
  }));

  const aggregate: TreasuryExecutionPlan = {
    id: planId,

    transferId: payload.transferId,

    capacityAssessmentId: payload.capacityAssessmentId,

    plannedAmount: payload.plannedAmount,

    destinationCurrency: payload.destinationCurrency,

    tranches,

    status: TREASURY_EXECUTION_PLAN_STATUS.DRAFT,

    plannedByActorId: context.actorId,

    plannedAt: payload.plannedAt,

    notes: payload.notes,

    metadata: {
      createdAt: context.requestedAt,

      updatedAt: context.requestedAt,

      createdByActorId: context.actorId,

      lastModifiedByActorId: context.actorId,

      version: 1,
    },
  };

  return {
    aggregate,

    event: {
      eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_PLAN_RECORDED,

      payload: {
        planId,

        transferId: payload.transferId,

        capacityAssessmentId: payload.capacityAssessmentId,

        plannedAmount: payload.plannedAmount,

        destinationCurrency: payload.destinationCurrency,

        tranches,

        plannedByActorId: context.actorId,

        plannedAt: payload.plannedAt,

        notes: payload.notes,
      },

      occurredAt: payload.plannedAt,
    },
  };
}
