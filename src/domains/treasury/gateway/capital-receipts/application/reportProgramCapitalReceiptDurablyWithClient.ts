import type { TransactionClient } from "@prisma/client";

import { reportProgramCapitalReceipt } from "../reportProgramCapitalReceipt";

import { persistNewProgramCapitalReceiptWithClient } from "../persistence/persistNewProgramCapitalReceiptWithClient";

import type { PersistedNewProgramCapitalReceipt } from "../persistence/contracts";

import type { ReportProgramCapitalReceiptDurably } from "./reportProgramCapitalReceiptDurablyContracts";

export async function reportProgramCapitalReceiptDurablyWithClient(params: {
  request: ReportProgramCapitalReceiptDurably;

  client: TransactionClient;
}): Promise<PersistedNewProgramCapitalReceipt> {
  const { request, client } = params;

  const result = reportProgramCapitalReceipt({
    receiptId: request.receiptId,

    reference: request.reference,

    command: {
      context: request.context,

      payload: request.payload,
    },
  });

  return persistNewProgramCapitalReceiptWithClient({
    result,

    eventId: request.eventId,

    context: request.context,

    client,
  });
}
