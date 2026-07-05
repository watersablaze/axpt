import { TREASURY_EVENT_TYPE } from "../events/eventType";

import { assertTreasuryExecutionTransition } from "./assertTransition";

import { TREASURY_EXECUTION_STATUS } from "./status";

import type { MarkTreasuryExecutionInitiated } from "./commands";

import type { TreasuryExecution } from "./contracts";

import type { TreasuryExecutionInitiatedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function markTreasuryExecutionInitiated(
  aggregate: TreasuryExecution,

  command: MarkTreasuryExecutionInitiated,
): TreasuryDomainResult<TreasuryExecution, TreasuryExecutionInitiatedPayload> {
  if (command.payload.executionId !== aggregate.id) {
    throw new Error(
      `[TREASURY_EXECUTION_COMMAND_TARGET_MISMATCH] ${command.payload.executionId} -> ${aggregate.id}`,
    );
  }

  if (command.payload.treasuryActionId.trim().length === 0) {
    throw new Error("[TREASURY_EXECUTION_OPERATIONAL_ACTION_ID_REQUIRED]");
  }

  if (command.payload.idempotencyKey.trim().length === 0) {
    throw new Error("[TREASURY_EXECUTION_IDEMPOTENCY_KEY_REQUIRED]");
  }

  const to = TREASURY_EXECUTION_STATUS.INITIATED;

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
      eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_INITIATED,

      payload: {
        executionId: aggregate.id,

        treasuryActionId: command.payload.treasuryActionId,

        treasuryActionStatus: command.payload.treasuryActionStatus,

        idempotencyKey: command.payload.idempotencyKey,

        initiatedAt: command.payload.initiatedAt,
      },

      occurredAt: command.payload.initiatedAt,
    },
  };
}
