import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { findTreasuryReconciliationPassesWithClient } from "./findTreasuryReconciliationPassesWithClient";

import type { LoadedTreasuryReconciliationPass } from "./contracts";

export async function findTreasuryReconciliationPasses(params: {
  limit: number;
}): Promise<readonly LoadedTreasuryReconciliationPass[]> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    findTreasuryReconciliationPassesWithClient({
      ...params,

      client: tx,
    }),
  );
}
