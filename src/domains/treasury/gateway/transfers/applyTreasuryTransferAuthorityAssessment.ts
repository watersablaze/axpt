import { TREASURY_EVENT_TYPE } from "../events/eventType";

import {
  TRANSFER_AUTHORITY_ASSESSMENT_RESULT,
  type TransferAuthorityAssessment,
} from "../transfer-authority-assessments/contracts";

import { assertTreasuryTransferTransition } from "./assertTransition";

import { TREASURY_TRANSFER_STATUS } from "./status";

import type { ApplyTreasuryTransferAuthorityAssessment } from "./commands";

import type { TreasuryTransfer } from "./contracts";

import type {
  TreasuryTransferAuthorizedPayload,
  TreasuryTransferAuthorityClarificationRequiredPayload,
  TreasuryTransferRejectedPayload,
} from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

type TreasuryTransferAuthorityOutcomePayload =
  | TreasuryTransferAuthorizedPayload
  | TreasuryTransferAuthorityClarificationRequiredPayload
  | TreasuryTransferRejectedPayload;

export function applyTreasuryTransferAuthorityAssessment(
  aggregate: TreasuryTransfer,

  assessment: TransferAuthorityAssessment,

  command: ApplyTreasuryTransferAuthorityAssessment,
): TreasuryDomainResult<
  TreasuryTransfer,
  TreasuryTransferAuthorityOutcomePayload
> {
  if (command.payload.transferId !== aggregate.id) {
    throw new Error(
      `[TREASURY_TRANSFER_COMMAND_TARGET_MISMATCH] ${command.payload.transferId} -> ${aggregate.id}`,
    );
  }

  if (command.payload.assessmentId !== assessment.id) {
    throw new Error(
      `[TRANSFER_AUTHORITY_ASSESSMENT_COMMAND_TARGET_MISMATCH] ${command.payload.assessmentId} -> ${assessment.id}`,
    );
  }

  if (assessment.transferId !== aggregate.id) {
    throw new Error(
      `[TRANSFER_AUTHORITY_ASSESSMENT_TRANSFER_MISMATCH] ${assessment.transferId} -> ${aggregate.id}`,
    );
  }

  const outcome = resolveTransferAuthorityOutcome(assessment.result);

  assertTreasuryTransferTransition(aggregate.status, outcome.status);

  const now = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      status: outcome.status,

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType: outcome.eventType,

      payload: {
        transferId: aggregate.id,

        assessmentId: assessment.id,
      },

      occurredAt: now,
    },
  };
}

function resolveTransferAuthorityOutcome(
  result: TransferAuthorityAssessment["result"],
): Readonly<{
  status:
    | typeof TREASURY_TRANSFER_STATUS.AUTHORIZED
    | typeof TREASURY_TRANSFER_STATUS.REQUIRES_CLARIFICATION
    | typeof TREASURY_TRANSFER_STATUS.REJECTED;

  eventType:
    | typeof TREASURY_EVENT_TYPE.TREASURY_TRANSFER_AUTHORIZED
    | typeof TREASURY_EVENT_TYPE.TREASURY_TRANSFER_AUTHORITY_CLARIFICATION_REQUIRED
    | typeof TREASURY_EVENT_TYPE.TREASURY_TRANSFER_REJECTED;
}> {
  switch (result) {
    case TRANSFER_AUTHORITY_ASSESSMENT_RESULT.AUTHORIZED:
      return {
        status: TREASURY_TRANSFER_STATUS.AUTHORIZED,

        eventType: TREASURY_EVENT_TYPE.TREASURY_TRANSFER_AUTHORIZED,
      };

    case TRANSFER_AUTHORITY_ASSESSMENT_RESULT.REQUIRES_CLARIFICATION:
      return {
        status: TREASURY_TRANSFER_STATUS.REQUIRES_CLARIFICATION,

        eventType:
          TREASURY_EVENT_TYPE.TREASURY_TRANSFER_AUTHORITY_CLARIFICATION_REQUIRED,
      };

    case TRANSFER_AUTHORITY_ASSESSMENT_RESULT.NOT_AUTHORIZED:
      return {
        status: TREASURY_TRANSFER_STATUS.REJECTED,

        eventType: TREASURY_EVENT_TYPE.TREASURY_TRANSFER_REJECTED,
      };
  }
}
