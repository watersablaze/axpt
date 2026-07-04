import { TREASURY_EXECUTION_STATUS } from "./status";

import { assertTreasuryExecutionTransition } from "./assertTransition";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryExecution } from "./contracts";

import type { MarkTreasuryExecutionReadyForAuthorization } from "./commands";

import type { TreasuryExecutionReadyForAuthorizationPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function markTreasuryExecutionReadyForAuthorization(
  aggregate: TreasuryExecution,
  command: MarkTreasuryExecutionReadyForAuthorization,
): TreasuryDomainResult<
  TreasuryExecution,
  TreasuryExecutionReadyForAuthorizationPayload
> {
  if (command.payload.executionId !== aggregate.id) {
    throw new Error(
      `[TREASURY_EXECUTION_COMMAND_TARGET_MISMATCH] ${command.payload.executionId} -> ${aggregate.id}`,
    );
  }

  const to = TREASURY_EXECUTION_STATUS.READY_FOR_AUTHORIZATION;

  assertTreasuryExecutionTransition(aggregate.status, to);

  const now = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      status: to,

      validatedAt: now,

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_READY_FOR_AUTHORIZATION,

      payload: {
        executionId: aggregate.id,

        validationEvidenceArtifactIds:
          command.payload.validationEvidenceArtifactIds,

        validationNotes: command.payload.validationNotes,

        validatedAt: now,
      },

      occurredAt: now,
    },
  };
}
