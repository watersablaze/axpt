import { TREASURY_EXECUTION_STATUS } from "./status";

import { assertTreasuryExecutionTransition } from "./assertTransition";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryExecution } from "./contracts";

import type { AcknowledgeTreasuryExecutionQueued } from "./commands";

import type { TreasuryExecutionQueuedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function acknowledgeTreasuryExecutionQueued(
  aggregate: TreasuryExecution,

  command: AcknowledgeTreasuryExecutionQueued,
): TreasuryDomainResult<TreasuryExecution, TreasuryExecutionQueuedPayload> {
  if (command.payload.executionId !== aggregate.id) {
    throw new Error(
      `[TREASURY_EXECUTION_COMMAND_TARGET_MISMATCH] ${command.payload.executionId} -> ${aggregate.id}`,
    );
  }

  if (command.payload.treasuryActionId.trim().length === 0) {
    throw new Error("[TREASURY_EXECUTION_OPERATIONAL_ACTION_ID_REQUIRED]");
  }

  if (command.payload.treasuryQueueJobId.trim().length === 0) {
    throw new Error("[TREASURY_EXECUTION_OPERATIONAL_QUEUE_ID_REQUIRED]");
  }

  const to = TREASURY_EXECUTION_STATUS.QUEUED;

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
      eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_QUEUED,

      payload: {
        executionId: aggregate.id,

        treasuryActionId: command.payload.treasuryActionId,

        treasuryQueueJobId: command.payload.treasuryQueueJobId,

        queuedAt: now,
      },

      occurredAt: now,
    },
  };
}
