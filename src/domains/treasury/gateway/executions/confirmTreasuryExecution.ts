import { TREASURY_EVENT_TYPE } from "../events/eventType";

import { assertVerifiedTreasuryExecutionSettlementMatchesExecution } from "./assertVerifiedTreasuryExecutionSettlementMatchesExecution";

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
  /*
   * Confirmation may only admit a verified settlement observation that
   * exactly agrees with the already-governed Treasury Execution.
   *
   * The rail proves reality. It does not redefine Treasury intent.
   */
  assertVerifiedTreasuryExecutionSettlementMatchesExecution({
    settlement: {
      executionId: command.payload.executionId,

      amount: command.payload.amount,

      verifiedAt: command.payload.verifiedAt,
    },

    execution: aggregate,
  });

  const to = TREASURY_EXECUTION_STATUS.CONFIRMED;

  assertTreasuryExecutionTransition(aggregate.status, to);

  /*
   * confirmedAt belongs to Treasury, not the rail.
   *
   * verifiedAt records when AXPT completed verification of external
   * evidence. confirmedAt records when Treasury admitted that verified
   * fact and changed canonical state.
   */
  const confirmedAt = command.context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      status: to,

      metadata: {
        ...aggregate.metadata,

        updatedAt: confirmedAt,

        lastModifiedByActorId: command.context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_CONFIRMED,

      payload: {
        executionId: aggregate.id,

        amount: command.payload.amount,

        verifiedAt: command.payload.verifiedAt,

        confirmedAt,
      },

      occurredAt: confirmedAt,
    },
  };
}
