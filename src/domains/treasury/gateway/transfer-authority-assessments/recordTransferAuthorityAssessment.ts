import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { RecordTransferAuthorityAssessment } from "./commands";

import type { TransferAuthorityAssessment } from "./contracts";

import type { TransferAuthorityAssessmentRecordedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

import type { TransferAuthorityAssessmentId } from "../shared/identifiers";

export function recordTransferAuthorityAssessment(params: {
  assessmentId: TransferAuthorityAssessmentId;

  command: RecordTransferAuthorityAssessment;
}): TreasuryDomainResult<
  TransferAuthorityAssessment,
  TransferAuthorityAssessmentRecordedPayload
> {
  const { assessmentId, command } = params;

  const { context, payload } = command;

  const aggregate: TransferAuthorityAssessment = {
    id: assessmentId,

    transferId: payload.transferId,

    result: payload.result,

    instructionId: payload.instructionId,

    authorityGrantId: payload.authorityGrantId,

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
      eventType: TREASURY_EVENT_TYPE.TRANSFER_AUTHORITY_ASSESSMENT_RECORDED,

      payload: {
        assessmentId,

        transferId: payload.transferId,

        result: payload.result,

        instructionId: payload.instructionId,

        authorityGrantId: payload.authorityGrantId,

        evidenceArtifactIds: payload.evidenceArtifactIds,

        assessedByActorId: context.actorId,

        assessedAt: payload.assessedAt,

        notes: payload.notes,
      },

      occurredAt: payload.assessedAt,
    },
  };
}
