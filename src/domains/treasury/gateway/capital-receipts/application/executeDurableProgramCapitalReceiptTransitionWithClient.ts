import type { TransactionClient } from "@prisma/client";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { TreasuryDomainResult } from "../../shared/domainResult";

import type {
  ProgramCapitalReceiptId,
  TreasuryEventId,
} from "../../shared/identifiers";

import type { ProgramCapitalReceipt } from "../contracts";

import type { PersistedProgramCapitalReceiptTransition } from "../persistence/contracts";

import { loadProgramCapitalReceiptWithClient } from "../persistence/loadProgramCapitalReceiptWithClient";

import { persistProgramCapitalReceiptTransitionWithClient } from "../persistence/persistProgramCapitalReceiptTransitionWithClient";

export async function executeDurableProgramCapitalReceiptTransitionWithClient<
  TPayload,
>(params: {
  receiptId: ProgramCapitalReceiptId;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  apply: (
    aggregate: ProgramCapitalReceipt,
  ) => TreasuryDomainResult<ProgramCapitalReceipt, TPayload>;

  client: TransactionClient;
}): Promise<PersistedProgramCapitalReceiptTransition<TPayload>> {
  const { receiptId, eventId, context, apply, client } = params;

  const loaded = await loadProgramCapitalReceiptWithClient({
    receiptId,

    client,
  });

  if (!loaded) {
    throw new Error(
      `[TREASURY_GATEWAY_CAPITAL_RECEIPT_NOT_FOUND] ${receiptId}`,
    );
  }

  const result = apply(loaded.aggregate);

  return persistProgramCapitalReceiptTransitionWithClient({
    expectedVersion: loaded.aggregate.metadata.version,

    result,

    eventId,

    context,

    client,
  });
}
