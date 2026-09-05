import type { TransactionClient } from "@prisma/client";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryAllocationId,
  TreasuryEventId,
} from "../../shared/identifiers";

import type { TreasuryMoney } from "../../shared/money";

import { consumeTreasuryAllocation } from "../consumeTreasuryAllocation";

import type { TreasuryAllocationConsumedPayload } from "../events";

import type { PersistedTreasuryAllocationTransition } from "../persistence/contracts";

import { executeDurableTreasuryAllocationTransitionWithClient } from "./executeDurableTreasuryAllocationTransitionWithClient";

export async function consumeTreasuryAllocationDurablyWithClient(params: {
  allocationId: TreasuryAllocationId;

  amount: TreasuryMoney;

  consumingSubjectType: string;

  consumingSubjectId: string;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<
  PersistedTreasuryAllocationTransition<TreasuryAllocationConsumedPayload>
> {
  const {
    allocationId,
    amount,
    consumingSubjectType,
    consumingSubjectId,
    eventId,
    context,
    client,
  } = params;

  return executeDurableTreasuryAllocationTransitionWithClient({
    allocationId,

    eventId,

    context,

    apply: (aggregate) =>
      consumeTreasuryAllocation(aggregate, {
        context,

        payload: {
          allocationId,

          amount,

          consumingSubjectType,

          consumingSubjectId,
        },
      }),

    client,
  });
}
