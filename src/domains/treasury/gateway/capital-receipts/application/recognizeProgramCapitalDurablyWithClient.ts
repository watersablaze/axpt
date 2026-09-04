import type { TransactionClient } from "@prisma/client";
import type { RecognizeProgramCapital } from "../commands";
import type { ProgramCapitalRecognizedPayload } from "../events";
import { recognizeProgramCapital } from "../recognizeProgramCapital";
import type { TreasuryEventId } from "../../shared/identifiers";
import type { PersistedProgramCapitalReceiptTransition } from "../persistence/contracts";
import { executeDurableProgramCapitalReceiptTransitionWithClient } from "./executeDurableProgramCapitalReceiptTransitionWithClient";

export async function recognizeProgramCapitalDurablyWithClient(params: {
  command: RecognizeProgramCapital;
  eventId: TreasuryEventId;
  client: TransactionClient;
}): Promise<
  PersistedProgramCapitalReceiptTransition<ProgramCapitalRecognizedPayload>
> {
  const { command, eventId, client } = params;

  return executeDurableProgramCapitalReceiptTransitionWithClient({
    receiptId: command.payload.receiptId,
    eventId,
    context: command.context,
    apply: (aggregate) => recognizeProgramCapital(aggregate, command),
    client,
  });
}
