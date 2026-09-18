import { TREASURY_EVENT_TYPE } from "../events/eventType";

import { assertVerifiedTreasuryExecutionSettlementMatchesExecution } from "./assertVerifiedTreasuryExecutionSettlementMatchesExecution";

import { assertTreasuryExecutionTransition } from "./assertTransition";

import { TREASURY_EXECUTION_STATUS } from "./status";

import type { TreasuryExecution } from "./contracts";

import type { TreasuryExecutionConfirmedPayload } from "./events";

import type { VerifiedTreasuryExecutionSettlement } from "./verifiedSettlementContracts";

import type { TreasuryCommandContext } from "../shared/commandContext";

import type { TreasuryDomainResult } from "../shared/domainResult";

export function confirmTreasuryExecution(
  aggregate: TreasuryExecution,

  params: Readonly<{
    settlement: VerifiedTreasuryExecutionSettlement;

    context: TreasuryCommandContext;
  }>,
): TreasuryDomainResult<TreasuryExecution, TreasuryExecutionConfirmedPayload> {
  const { settlement, context } = params;

  /*
   * Confirmation receives an already-admitted verified settlement
   * observation. It does not reconstruct verification authority from a
   * generic command payload.
   *
   * The rail proves reality. It does not redefine Treasury intent.
   */
  assertVerifiedTreasuryExecutionSettlementMatchesExecution({
    settlement,

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
  const confirmedAt = context.requestedAt;

  return {
    aggregate: {
      ...aggregate,

      status: to,

      metadata: {
        ...aggregate.metadata,

        updatedAt: confirmedAt,

        lastModifiedByActorId: context.actorId,

        version: aggregate.metadata.version + 1,
      },
    },

    event: {
      eventType: TREASURY_EVENT_TYPE.TREASURY_EXECUTION_CONFIRMED,

      payload: {
        executionId: aggregate.id,

        amount: settlement.amount,

        verifiedAt: settlement.verifiedAt,

        confirmedAt,
      },

      occurredAt: confirmedAt,
    },
  };
}
