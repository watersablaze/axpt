import { TREASURY_INSTRUCTION_STATUS } from "./status";

import { assertTreasuryInstructionTransition } from "./assertTransition";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryInstruction } from "./contracts";

import type { BeginTreasuryInstructionAuthorityReview } from "./commands";

import type { TreasuryInstructionAuthorityReviewStartedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function beginTreasuryInstructionAuthorityReview(
  aggregate: TreasuryInstruction,
  command: BeginTreasuryInstructionAuthorityReview,
): TreasuryDomainResult<
  TreasuryInstruction,
  TreasuryInstructionAuthorityReviewStartedPayload
> {
  if (command.payload.instructionId !== aggregate.id) {
    throw new Error(
      `[TREASURY_INSTRUCTION_COMMAND_TARGET_MISMATCH] ${command.payload.instructionId} -> ${aggregate.id}`,
    );
  }

  const to = TREASURY_INSTRUCTION_STATUS.AUTHORITY_REVIEW;

  assertTreasuryInstructionTransition(aggregate.status, to);

  const now = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      status: to,

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType:
        TREASURY_EVENT_TYPE.TREASURY_INSTRUCTION_AUTHORITY_REVIEW_STARTED,

      payload: {
        instructionId: aggregate.id,
      },

      occurredAt: now,
    },
  };
}
