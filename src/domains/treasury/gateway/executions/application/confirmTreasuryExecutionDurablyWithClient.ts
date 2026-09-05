import type { TransactionClient } from "@prisma/client";

import { confirmTreasuryExecution } from "../confirmTreasuryExecution";

import { executeDurableTreasuryExecutionTransitionWithClient } from "./executeDurableTreasuryExecutionTransitionWithClient";

import type { InternalWalletExecutionConfirmedEvidence } from "../adapters/internal-wallet/executionEvidenceContracts";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { TreasuryExecutionConfirmedPayload } from "../events";

import type { PersistedTreasuryExecutionTransition } from "../persistence/contracts";

export async function confirmTreasuryExecutionDurablyWithClient(params: {
  evidence: InternalWalletExecutionConfirmedEvidence;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<
  PersistedTreasuryExecutionTransition<TreasuryExecutionConfirmedPayload>
> {
  const { evidence, eventId, context, client } = params;

  return executeDurableTreasuryExecutionTransitionWithClient({
    executionId: evidence.executionId,

    eventId,

    context,

    apply: (aggregate) =>
      confirmTreasuryExecution(aggregate, {
        context,

        payload: {
          executionId: evidence.executionId,

          treasuryActionId: evidence.treasuryActionId,

          idempotencyKey: evidence.idempotencyKey,

          debitTransactionId: evidence.debitTransactionId,

          creditTransactionId: evidence.creditTransactionId,

          assetCode: evidence.assetCode,

          amountBaseUnits: evidence.amountBaseUnits,

          confirmedAt: evidence.confirmedAt,
        },
      }),

    client,
  });
}
