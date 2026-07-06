import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { loadTreasuryReconciliationPassLifecycleWithClient } from "./loadTreasuryReconciliationPassLifecycleWithClient";

import type { LoadedTreasuryReconciliationPassLifecycle } from "./contracts";

export async function loadTreasuryReconciliationPassLifecycle(
  passId: string,
): Promise<LoadedTreasuryReconciliationPassLifecycle> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    loadTreasuryReconciliationPassLifecycleWithClient({
      passId,

      client: tx,
    }),
  );
}
