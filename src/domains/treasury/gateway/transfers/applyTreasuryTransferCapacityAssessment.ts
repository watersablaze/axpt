import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TransferCapacityAssessment } from "../transfer-capacity-assessments/contracts";

import { assertTreasuryTransferTransition } from "./assertTransition";

import { TREASURY_TRANSFER_STATUS } from "./status";

import type { ApplyTreasuryTransferCapacityAssessment } from "./commands";

import type { TreasuryTransfer } from "./contracts";

import type {
  TreasuryTransferCapacityAssessedPayload,
  TreasuryTransferCapacityUndeterminedPayload,
} from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

type TreasuryTransferCapacityOutcomePayload =
  | TreasuryTransferCapacityAssessedPayload
  | TreasuryTransferCapacityUndeterminedPayload;

export function applyTreasuryTransferCapacityAssessment(
  aggregate: TreasuryTransfer,

  assessment: TransferCapacityAssessment,

  command: ApplyTreasuryTransferCapacityAssessment,
): TreasuryDomainResult<
  TreasuryTransfer,
  TreasuryTransferCapacityOutcomePayload
> {
  if (command.payload.transferId !== aggregate.id) {
    throw new Error(
      `[TREASURY_TRANSFER_COMMAND_TARGET_MISMATCH] ${command.payload.transferId} -> ${aggregate.id}`,
    );
  }

  if (command.payload.assessmentId !== assessment.id) {
    throw new Error(
      `[TRANSFER_CAPACITY_ASSESSMENT_COMMAND_TARGET_MISMATCH] ${command.payload.assessmentId} -> ${assessment.id}`,
    );
  }

  if (assessment.transferId !== aggregate.id) {
    throw new Error(
      `[TRANSFER_CAPACITY_ASSESSMENT_TRANSFER_MISMATCH] ${assessment.transferId} -> ${aggregate.id}`,
    );
  }

  const outcome =
    assessment.executableNow === undefined
      ? {
          status: TREASURY_TRANSFER_STATUS.CAPACITY_UNDETERMINED,

          eventType:
            TREASURY_EVENT_TYPE.TREASURY_TRANSFER_CAPACITY_UNDETERMINED,
        }
      : {
          status: TREASURY_TRANSFER_STATUS.CAPACITY_ASSESSED,

          eventType: TREASURY_EVENT_TYPE.TREASURY_TRANSFER_CAPACITY_ASSESSED,
        };

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
