import type { TransactionClient } from "@prisma/client";

import type { ProgramAccountId } from "../../shared/identifiers";

import type { CurrencyCode } from "../../shared/money";

import type { CommittedCapitalPosition } from "../committedCapitalPosition";

import { deriveCommittedCapitalPosition } from "../deriveCommittedCapitalPosition";

import { loadCommittedTreasuryAllocationsWithClient } from "../persistence/loadCommittedTreasuryAllocationsWithClient";

export async function getCommittedCapitalPositionWithClient(params: {
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  client: TransactionClient;
}): Promise<CommittedCapitalPosition> {
  const { programAccountId, currency, client } = params;

  const allocations = await loadCommittedTreasuryAllocationsWithClient({
    programAccountId,

    currency,

    client,
  });

  return deriveCommittedCapitalPosition({
    programAccountId,

    currency,

    allocations,
  });
}
