import { TREASURY_EVENT_TYPE } from "../events/eventType";

import { assertTreasuryExecutionTransition } from "./assertTransition";

import { TREASURY_EXECUTION_STATUS } from "./status";

import type { ConfirmTreasuryExecution } from "./commands";

import type { TreasuryExecution } from "./contracts";

import type { TreasuryExecutionConfirmedPayload } from "./events";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function confirmTreasuryExecution(
  aggregate: TreasuryExecution,

  command: ConfirmTreasuryExecution,
): TreasuryDomainResult<TreasuryExecution, TreasuryExecutionConfirmedPayload> {
  if (command.payload.executionId !== aggregate.id) {
    throw new Error(
      `[TREASURY_EXECUTION_COMMAND_TARGET_MISMATCH] ${command.payload.executionId} -> ${aggregate.id}`,
    );
  }

  if (
    command.payload.treasuryActionId.trim().length === 0 ||
    command.payload.idempotencyKey.trim().length === 0 ||
    command.payload.debitTransactionId.trim().length === 0 ||
    command.payload.creditTransactionId.trim().length === 0
  ) {
    throw new Error("[TREASURY_EXECUTION_CONFIRMATION_EVIDENCE_REQUIRED]");
  }

  if (
    command.payload.assetCode.trim().length === 0 ||
    command.payload.amountBaseUnits.trim().length === 0
  ) {
    throw new Error("[TREASURY_EXECUTION_CONFIRMATION_VALUE_REQUIRED]");
  }

  const to = TREASURY_EXECUTION_STATUS.CONFIRMED;

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
      eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_CONFIRMED,

      payload: {
        executionId: aggregate.id,

        treasuryActionId: command.payload.treasuryActionId,

        idempotencyKey: command.payload.idempotencyKey,

        debitTransactionId: command.payload.debitTransactionId,

        creditTransactionId: command.payload.creditTransactionId,

        assetCode: command.payload.assetCode,

        amountBaseUnits: command.payload.amountBaseUnits,

        confirmedAt: command.payload.confirmedAt,
      },

      occurredAt: command.payload.confirmedAt,
    },
  };
}
