import type { TransactionClient } from "@prisma/client";

import { getCommittedCapitalPositionWithClient } from "../../allocations/application/getCommittedCapitalPositionWithClient";

import type { ProgramAccountId } from "../../shared/identifiers";

import type { CurrencyCode } from "../../shared/money";

import type { AvailableCapitalPosition } from "../availableCapitalPosition";

import { deriveAvailableCapitalPosition } from "../deriveAvailableCapitalPosition";

import { getGrossTreasuryPositionWithClient } from "./getGrossTreasuryPositionWithClient";

export async function getAvailableCapitalPositionWithClient(params: {
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  client: TransactionClient;
}): Promise<AvailableCapitalPosition> {
  const { programAccountId, currency, client } = params;

  const grossPosition =
    await getGrossTreasuryPositionWithClient({
      programAccountId,

      currency,

      client,
    });

  const committedPosition =
    await getCommittedCapitalPositionWithClient({
      programAccountId,

      currency,

      client,
    });

  return deriveAvailableCapitalPosition({
    programAccountId,

    currency,

    grossPosition,

    committedPosition,
  });
}
