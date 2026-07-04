import { TREASURY_EXECUTION_STATUS } from "./status";

import { assertTreasuryExecutionTransition } from "./assertTransition";

import { TREASURY_EVENT_TYPE } from "../events/eventType";

import type { TreasuryExecution } from "./contracts";

import type { AuthorizeTreasuryExecution } from "./commands";

import type { TreasuryExecutionAuthorizedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function authorizeTreasuryExecution(
  aggregate: TreasuryExecution,
  command: AuthorizeTreasuryExecution,
): TreasuryDomainResult<TreasuryExecution, TreasuryExecutionAuthorizedPayload> {
  if (command.payload.executionId !== aggregate.id) {
    throw new Error(
      `[TREASURY_EXECUTION_COMMAND_TARGET_MISMATCH] ${command.payload.executionId} -> ${aggregate.id}`,
    );
  }

  if (command.payload.approvalIds.length === 0) {
    throw new Error("[TREASURY_EXECUTION_APPROVAL_EVIDENCE_REQUIRED]");
  }

  const to = TREASURY_EXECUTION_STATUS.AUTHORIZED;

  assertTreasuryExecutionTransition(aggregate.status, to);

  const now = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      status: to,

      authorizedAt: now,

      metadata: {
        ...aggregate.metadata,

        updatedAt: now,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_AUTHORIZED,

      payload: {
        executionId: aggregate.id,

        approvalIds: command.payload.approvalIds,

        authorizedAt: now,
      },

      occurredAt: now,
    },
  };
}
