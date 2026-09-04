import type { TransactionClient } from "@prisma/client";

import type { RegisterExpectedProgramCapitalReceipt } from "../commands";
import type { CapitalReceiptExpectedPayload } from "../events";
import { registerExpectedProgramCapitalReceipt } from "../registerExpectedProgramCapitalReceipt";

import type {
  ProgramCapitalReceiptId,
  TreasuryEventId,
} from "../../shared/identifiers";

import type { PersistedNewProgramCapitalReceipt } from "../persistence/contracts";
import { persistNewExpectedProgramCapitalReceiptWithClient } from "../persistence/persistNewExpectedProgramCapitalReceiptWithClient";

export async function registerExpectedProgramCapitalReceiptDurablyWithClient(params: {
  receiptId: ProgramCapitalReceiptId;

  reference: string;

  command: RegisterExpectedProgramCapitalReceipt;

  eventId: TreasuryEventId;

  client: TransactionClient;
}): Promise<PersistedNewProgramCapitalReceipt<CapitalReceiptExpectedPayload>> {
  const { receiptId, reference, command, eventId, client } = params;

  const result = registerExpectedProgramCapitalReceipt({
    receiptId,

    reference,

    command,
  });

  return persistNewExpectedProgramCapitalReceiptWithClient({
    result,

    eventId,

    context: command.context,

    client,
  });
}
