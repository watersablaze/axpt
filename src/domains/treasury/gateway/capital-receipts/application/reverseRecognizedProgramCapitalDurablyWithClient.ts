import type { TransactionClient } from "@prisma/client";

import type { ReverseRecognizedProgramCapital } from "../commands";
import type { ProgramCapitalRecognitionReversedPayload } from "../events";
import { reverseRecognizedProgramCapital } from "../reverseRecognizedProgramCapital";
import type { TreasuryEventId } from "../../shared/identifiers";
import type { PersistedProgramCapitalReceiptTransition } from "../persistence/contracts";
import { executeDurableProgramCapitalReceiptTransitionWithClient } from "./executeDurableProgramCapitalReceiptTransitionWithClient";

export async function reverseRecognizedProgramCapitalDurablyWithClient(params: {
  command: ReverseRecognizedProgramCapital;
  eventId: TreasuryEventId;
  client: TransactionClient;
}): Promise<
  PersistedProgramCapitalReceiptTransition<ProgramCapitalRecognitionReversedPayload>
> {
  const { command, eventId, client } = params;

  return executeDurableProgramCapitalReceiptTransitionWithClient({
    receiptId: command.payload.receiptId,
    eventId,
    context: command.context,
    apply: (aggregate) =>
      reverseRecognizedProgramCapital(aggregate, command),
    client,
  });
}
