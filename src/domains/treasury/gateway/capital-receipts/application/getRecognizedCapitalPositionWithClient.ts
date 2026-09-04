import type { TransactionClient } from "@prisma/client";

import type { ProgramAccountId } from "../../shared/identifiers";

import type { CurrencyCode } from "../../shared/money";

import { deriveRecognizedCapitalPosition } from "../deriveRecognizedCapitalPosition";

import type { RecognizedCapitalPosition } from "../recognizedCapitalPosition";

import { loadRecognizedProgramCapitalReceiptsWithClient } from "../persistence/loadRecognizedProgramCapitalReceiptsWithClient";

export async function getRecognizedCapitalPositionWithClient(params: {
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  client: TransactionClient;
}): Promise<RecognizedCapitalPosition> {
  const { programAccountId, currency, client } = params;

  const receipts = await loadRecognizedProgramCapitalReceiptsWithClient({
    programAccountId,

    currency,

    client,
  });

  return deriveRecognizedCapitalPosition({
    programAccountId,

    currency,

    receipts,
  });
}
