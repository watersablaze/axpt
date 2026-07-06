import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { reconcileTreasuryExecutionByDispatchOwnershipDurablyWithClient } from "./reconcileTreasuryExecutionByDispatchOwnershipDurablyWithClient";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryEventId,
  TreasuryExecutionId,
} from "../../shared/identifiers";

import type { ReconcileTreasuryExecutionByDispatchOwnershipResult } from "./reconcileTreasuryExecutionByDispatchOwnershipContracts";

export async function reconcileTreasuryExecutionByDispatchOwnershipDurably(params: {
  executionId: TreasuryExecutionId;

  initiatedEventId: TreasuryEventId;

  confirmedEventId: TreasuryEventId;

  context: TreasuryCommandContext;
}): Promise<ReconcileTreasuryExecutionByDispatchOwnershipResult> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    reconcileTreasuryExecutionByDispatchOwnershipDurablyWithClient({
      ...params,

      client: tx,
    }),
  );
}
