import type { TransactionClient } from "@prisma/client";

import { loadTreasuryAllocationsByIdsWithClient } from "../../allocations/persistence/loadTreasuryAllocationsByIdsWithClient";

import type { ProgramAccountId } from "../../shared/identifiers";

import type { CurrencyCode } from "../../shared/money";

import type { ConfirmedOutboundCapitalPosition } from "../confirmedOutboundCapitalPosition";

import {
  deriveConfirmedOutboundCapitalPosition,
  type ConfirmedOutboundCapitalContribution,
} from "../deriveConfirmedOutboundCapitalPosition";

import { loadConfirmedTreasuryExecutionsWithClient } from "../persistence/loadConfirmedTreasuryExecutionsWithClient";

export async function getConfirmedOutboundCapitalPositionWithClient(params: {
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  client: TransactionClient;
}): Promise<ConfirmedOutboundCapitalPosition> {
  const { programAccountId, currency, client } = params;

  const executions = await loadConfirmedTreasuryExecutionsWithClient({
    currency,

    client,
  });

  if (executions.length === 0) {
    return deriveConfirmedOutboundCapitalPosition({
      programAccountId,

      currency,

      contributions: [],
    });
  }

  const allocationIds = [
    ...new Set(executions.map((execution) => execution.allocationId)),
  ];

  const allocations = await loadTreasuryAllocationsByIdsWithClient({
    allocationIds,

    client,
  });

  const allocationsById = new Map(
    allocations.map((allocation) => [allocation.id, allocation]),
  );

  const contributions: ConfirmedOutboundCapitalContribution[] = [];

  for (const execution of executions) {
    const allocation = allocationsById.get(execution.allocationId);

    if (!allocation) {
      throw new Error(
        `[CONFIRMED_OUTBOUND_CAPITAL_POSITION_ALLOCATION_NOT_FOUND] ${execution.id}:${execution.allocationId}`,
      );
    }

    /*
     * Account attribution belongs to the durable allocation.
     *
     * Filtering happens only after both canonical aggregates have been
     * decoded and integrity-checked by their persistence loaders.
     */
    if (allocation.sourceProgramAccountId !== programAccountId) {
      continue;
    }

    contributions.push({
      execution,

      allocation,
    });
  }

  return deriveConfirmedOutboundCapitalPosition({
    programAccountId,

    currency,

    contributions,
  });
}
