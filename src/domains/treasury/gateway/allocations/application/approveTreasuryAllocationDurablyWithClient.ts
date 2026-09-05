import type { TransactionClient } from "@prisma/client";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryAllocationId,
  TreasuryApprovalId,
  TreasuryEventId,
} from "../../shared/identifiers";

import { approveTreasuryAllocation } from "../approveTreasuryAllocation";

import type { TreasuryAllocationApprovedPayload } from "../events";

import type { PersistedTreasuryAllocationTransition } from "../persistence/contracts";

import { executeDurableTreasuryAllocationTransitionWithClient } from "./executeDurableTreasuryAllocationTransitionWithClient";

export async function approveTreasuryAllocationDurablyWithClient(params: {
  allocationId: TreasuryAllocationId;

  approvalIds: readonly TreasuryApprovalId[];

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<
  PersistedTreasuryAllocationTransition<TreasuryAllocationApprovedPayload>
> {
  const {
    allocationId,
    approvalIds,
    eventId,
    context,
    client,
  } = params;

  return executeDurableTreasuryAllocationTransitionWithClient({
    allocationId,

    eventId,

    context,

    apply: (aggregate) =>
      approveTreasuryAllocation(aggregate, {
        context,

        payload: {
          allocationId,

          approvalIds,
        },
      }),

    client,
  });
}
