import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { findTreasuryExecutionReconciliationCandidatesWithClient } from "./findTreasuryExecutionReconciliationCandidatesWithClient";

import type { LoadedTreasuryExecution } from "./contracts";

export async function findTreasuryExecutionReconciliationCandidates(params: {
  limit: number;
}): Promise<readonly LoadedTreasuryExecution[]> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    findTreasuryExecutionReconciliationCandidatesWithClient({
      ...params,

      client: tx,
    }),
  );
}
