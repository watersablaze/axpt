import type { TransactionClient } from "@prisma/client";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  ProgramCapitalReceiptId,
  TreasuryEventId,
} from "../../shared/identifiers";

import { beginProgramCapitalReceiptVerification } from "../beginProgramCapitalReceiptVerification";

import type { PersistedProgramCapitalReceiptTransition } from "../persistence/contracts";

import { executeDurableProgramCapitalReceiptTransitionWithClient } from "./executeDurableProgramCapitalReceiptTransitionWithClient";

import type { CapitalReceiptVerificationStartedPayload } from "../events";

export async function beginProgramCapitalReceiptVerificationDurablyWithClient(params: {
  receiptId: ProgramCapitalReceiptId;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<
  PersistedProgramCapitalReceiptTransition<CapitalReceiptVerificationStartedPayload>
> {
  const { receiptId, eventId, context, client } = params;

  return executeDurableProgramCapitalReceiptTransitionWithClient({
    receiptId,

    eventId,

    context,

    apply: (aggregate) =>
      beginProgramCapitalReceiptVerification(aggregate, {
        context,

        payload: {
          receiptId,
        },
      }),

    client,
  });
}
