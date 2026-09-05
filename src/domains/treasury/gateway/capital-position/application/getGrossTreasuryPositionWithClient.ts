import type { TransactionClient } from "@prisma/client";

import { getRecognizedCapitalPositionWithClient } from "../../capital-receipts/application/getRecognizedCapitalPositionWithClient";

import { getConfirmedOutboundCapitalPositionWithClient } from "../../executions/application/getConfirmedOutboundCapitalPositionWithClient";

import type { ProgramAccountId } from "../../shared/identifiers";

import type { CurrencyCode } from "../../shared/money";

import { deriveGrossTreasuryPosition } from "../deriveGrossTreasuryPosition";

import type { GrossTreasuryPosition } from "../grossTreasuryPosition";

export async function getGrossTreasuryPositionWithClient(params: {
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  client: TransactionClient;
}): Promise<GrossTreasuryPosition> {
  const { programAccountId, currency, client } = params;

  const recognizedPosition =
    await getRecognizedCapitalPositionWithClient({
      programAccountId,

      currency,

      client,
    });

  const confirmedOutboundPosition =
    await getConfirmedOutboundCapitalPositionWithClient({
      programAccountId,

      currency,

      client,
    });

  return deriveGrossTreasuryPosition({
    programAccountId,

    currency,

    recognizedPosition,

    confirmedOutboundPosition,
  });
}
