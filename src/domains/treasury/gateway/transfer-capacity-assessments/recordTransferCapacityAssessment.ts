import { TREASURY_EVENT_TYPE } from "../events/eventType";

import { computeExecutableTransferCapacity } from "./computeExecutableTransferCapacity";

import type { RecordTransferCapacityAssessment } from "./commands";

import type { TransferCapacityAssessment } from "./contracts";

import type { TransferCapacityAssessmentRecordedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

import type { TransferCapacityAssessmentId } from "../shared/identifiers";

export function recordTransferCapacityAssessment(params: {
  assessmentId: TransferCapacityAssessmentId;

  command: RecordTransferCapacityAssessment;
}): TreasuryDomainResult<
  TransferCapacityAssessment,
  TransferCapacityAssessmentRecordedPayload
> {
  const { assessmentId, command } = params;

  const { context, payload } = command;

  const executableNow = computeExecutableTransferCapacity({
    requestedAmount: payload.requestedAmount,

    constraints: payload.constraints,
  });

  const aggregate: TransferCapacityAssessment = {
    id: assessmentId,

    transferId: payload.transferId,

    requestedAmount: payload.requestedAmount,

    constraints: payload.constraints,

    executableNow,

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
      eventType: TREASURY_EVENT_TYPE.TRANSFER_CAPACITY_ASSESSMENT_RECORDED,

      payload: {
        assessmentId,

        transferId: payload.transferId,

        requestedAmount: payload.requestedAmount,

        constraints: payload.constraints,

        executableNow,

        assessedByActorId: context.actorId,

        assessedAt: payload.assessedAt,

        notes: payload.notes,
      },

      occurredAt: payload.assessedAt,
    },
  };
}
