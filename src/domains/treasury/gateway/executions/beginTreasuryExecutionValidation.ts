import { TREASURY_EXECUTION_STATUS } from "./status";

import { assertTreasuryExecutionTransition } from "./assertTransition";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryExecution } from "./contracts";

import type { BeginTreasuryExecutionValidation } from "./commands";

import type { TreasuryExecutionValidationStartedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function beginTreasuryExecutionValidation(
  aggregate: TreasuryExecution,
  command: BeginTreasuryExecutionValidation,
): TreasuryDomainResult<
  TreasuryExecution,
  TreasuryExecutionValidationStartedPayload
> {
  if (command.payload.executionId !== aggregate.id) {
    throw new Error(
      `[TREASURY_EXECUTION_COMMAND_TARGET_MISMATCH] ${command.payload.executionId} -> ${aggregate.id}`,
    );
  }

  const to = TREASURY_EXECUTION_STATUS.VALIDATING;

  assertTreasuryExecutionTransition(aggregate.status, to);

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
      eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_VALIDATION_STARTED,

      payload: {
        executionId: aggregate.id,
      },

      occurredAt: now,
    },
  };
}
