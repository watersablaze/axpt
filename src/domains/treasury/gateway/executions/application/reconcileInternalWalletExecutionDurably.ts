import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { reconcileInternalWalletExecutionDurablyWithClient } from "./reconcileInternalWalletExecutionDurablyWithClient";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryEventId,
  TreasuryExecutionId,
} from "../../shared/identifiers";

import type { ReconciledInternalWalletExecution } from "./reconcileInternalWalletExecutionDurablyContracts";

export async function reconcileInternalWalletExecutionDurably(params: {
  executionId: TreasuryExecutionId;

  initiatedEventId: TreasuryEventId;

  confirmedEventId: TreasuryEventId;

  context: TreasuryCommandContext;
}): Promise<ReconciledInternalWalletExecution> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    reconcileInternalWalletExecutionDurablyWithClient({
      ...params,

      client: tx,
    }),
  );
}
