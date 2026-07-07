import { TREASURY_EVENT_TYPE } from "../events/eventType";

import {
  EXECUTABLE_TRANCHE_STATUS,
  TREASURY_EXECUTION_PLAN_STATUS,
} from "../execution-plans/status";

import type { TreasuryExecutionPlan } from "../execution-plans/contracts";

import type { RecordExecutableTrancheEligibilityAssessment } from "./commands";

import type { ExecutableTrancheEligibilityAssessment } from "./contracts";

import type { ExecutableTrancheEligibilityAssessmentRecordedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

import type { ExecutableTrancheEligibilityAssessmentId } from "../shared/identifiers";

export function recordExecutableTrancheEligibilityAssessment(params: {
  assessmentId: ExecutableTrancheEligibilityAssessmentId;

  plan: TreasuryExecutionPlan;

  command: RecordExecutableTrancheEligibilityAssessment;
}): TreasuryDomainResult<
  ExecutableTrancheEligibilityAssessment,
  ExecutableTrancheEligibilityAssessmentRecordedPayload
> {
  const { assessmentId, plan, command } = params;

  const { context, payload } = command;

  if (payload.transferId !== plan.transferId) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_ELIGIBILITY_TRANSFER_MISMATCH] ${payload.transferId} -> ${plan.transferId}`,
    );
  }

  if (payload.planId !== plan.id) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_ELIGIBILITY_PLAN_MISMATCH] ${payload.planId} -> ${plan.id}`,
    );
  }

  if (plan.status !== TREASURY_EXECUTION_PLAN_STATUS.RECORDED) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_ELIGIBILITY_PLAN_NOT_RECORDED] ${plan.status}`,
    );
  }

  const tranche = plan.tranches.find(
    (candidate) => candidate.id === payload.trancheId,
  );

  if (!tranche) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_ELIGIBILITY_TRANCHE_NOT_FOUND] ${payload.trancheId}`,
    );
  }

  if (tranche.status !== EXECUTABLE_TRANCHE_STATUS.PLANNED) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_ELIGIBILITY_TRANCHE_NOT_PLANNED] ${tranche.status}`,
    );
  }

  const aggregate: ExecutableTrancheEligibilityAssessment = {
    id: assessmentId,

    transferId: payload.transferId,

    planId: payload.planId,

    trancheId: payload.trancheId,

    result: payload.result,

    evidenceArtifactIds: payload.evidenceArtifactIds,

    assessedByActorId: context.actorId,

    assessedAt: payload.assessedAt,

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
      eventType:
        TREASURY_EVENT_TYPE.EXECUTABLE_TRANCHE_ELIGIBILITY_ASSESSMENT_RECORDED,

      payload: {
        assessmentId,

        transferId: payload.transferId,

        planId: payload.planId,

        trancheId: payload.trancheId,

        result: payload.result,

        evidenceArtifactIds: payload.evidenceArtifactIds,

        assessedByActorId: context.actorId,

        assessedAt: payload.assessedAt,

        notes: payload.notes,
      },

      occurredAt: payload.assessedAt,
    },
  };
}
