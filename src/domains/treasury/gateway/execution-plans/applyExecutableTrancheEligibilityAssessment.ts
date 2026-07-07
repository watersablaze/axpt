import { TREASURY_EVENT_TYPE } from "../events/eventType";

import { EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT } from "../executable-tranche-eligibility-assessments/contracts";

import type { ExecutableTrancheEligibilityAssessment } from "../executable-tranche-eligibility-assessments/contracts";

import type { TreasuryDomainResult } from "../shared/domainResult";

import type { ApplyExecutableTrancheEligibilityAssessment } from "./commands";

import type { TreasuryExecutionPlan } from "./contracts";

import type { ExecutableTrancheEligibilityAppliedPayload } from "./events";

import {
  EXECUTABLE_TRANCHE_STATUS,
  TREASURY_EXECUTION_PLAN_STATUS,
} from "./status";

export function applyExecutableTrancheEligibilityAssessment(
  aggregate: TreasuryExecutionPlan,

  assessment: ExecutableTrancheEligibilityAssessment,

  command: ApplyExecutableTrancheEligibilityAssessment,
): TreasuryDomainResult<
  TreasuryExecutionPlan,
  ExecutableTrancheEligibilityAppliedPayload
> {
  if (command.payload.planId !== aggregate.id) {
    throw new Error(
      `[TREASURY_EXECUTION_PLAN_COMMAND_TARGET_MISMATCH] ${command.payload.planId} -> ${aggregate.id}`,
    );
  }

  if (command.payload.assessmentId !== assessment.id) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_ELIGIBILITY_ASSESSMENT_COMMAND_TARGET_MISMATCH] ${command.payload.assessmentId} -> ${assessment.id}`,
    );
  }

  if (aggregate.status !== TREASURY_EXECUTION_PLAN_STATUS.RECORDED) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_ELIGIBILITY_PLAN_NOT_RECORDED] ${aggregate.status}`,
    );
  }

  if (assessment.planId !== aggregate.id) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_ELIGIBILITY_PLAN_MISMATCH] ${assessment.planId} -> ${aggregate.id}`,
    );
  }

  if (assessment.transferId !== aggregate.transferId) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_ELIGIBILITY_TRANSFER_MISMATCH] ${assessment.transferId} -> ${aggregate.transferId}`,
    );
  }

  const tranche = aggregate.tranches.find(
    (candidate) => candidate.id === assessment.trancheId,
  );

  if (!tranche) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_ELIGIBILITY_TRANCHE_NOT_FOUND] ${assessment.trancheId}`,
    );
  }

  if (tranche.status !== EXECUTABLE_TRANCHE_STATUS.PLANNED) {
    throw new Error(
      `[EXECUTABLE_TRANCHE_ELIGIBILITY_TRANCHE_ALREADY_RESOLVED] ${tranche.status}`,
    );
  }

  let to:
    | typeof EXECUTABLE_TRANCHE_STATUS.ELIGIBLE
    | typeof EXECUTABLE_TRANCHE_STATUS.INELIGIBLE
    | typeof EXECUTABLE_TRANCHE_STATUS.REQUIRES_CLARIFICATION;

  let eventType:
    | typeof TREASURY_EVENT_TYPE.EXECUTABLE_TRANCHE_MARKED_ELIGIBLE
    | typeof TREASURY_EVENT_TYPE.EXECUTABLE_TRANCHE_MARKED_INELIGIBLE
    | typeof TREASURY_EVENT_TYPE.EXECUTABLE_TRANCHE_ELIGIBILITY_CLARIFICATION_REQUIRED;

  switch (assessment.result) {
    case EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT.ELIGIBLE:
      to = EXECUTABLE_TRANCHE_STATUS.ELIGIBLE;

      eventType = TREASURY_EVENT_TYPE.EXECUTABLE_TRANCHE_MARKED_ELIGIBLE;

      break;

    case EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT.INELIGIBLE:
      to = EXECUTABLE_TRANCHE_STATUS.INELIGIBLE;

      eventType = TREASURY_EVENT_TYPE.EXECUTABLE_TRANCHE_MARKED_INELIGIBLE;

      break;

    case EXECUTABLE_TRANCHE_ELIGIBILITY_RESULT.REQUIRES_CLARIFICATION:
      to = EXECUTABLE_TRANCHE_STATUS.REQUIRES_CLARIFICATION;

      eventType =
        TREASURY_EVENT_TYPE.EXECUTABLE_TRANCHE_ELIGIBILITY_CLARIFICATION_REQUIRED;

      break;
  }

  const now = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      tranches: aggregate.tranches.map((candidate) =>
        candidate.id === tranche.id
          ? {
              ...candidate,

              status: to,
            }
          : candidate,
      ),

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType,

      payload: {
        planId: aggregate.id,

        trancheId: tranche.id,

        assessmentId: assessment.id,
      },

      occurredAt: now,
    },
  };
}
