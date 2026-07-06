import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { loadTreasuryReconciliationPassWithClient } from "./loadTreasuryReconciliationPassWithClient";

import type { LoadedTreasuryReconciliationPass } from "./contracts";

export async function loadTreasuryReconciliationPass(
  passId: string,
): Promise<LoadedTreasuryReconciliationPass | null> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    loadTreasuryReconciliationPassWithClient({
      passId,

      client: tx,
    }),
  );
}
