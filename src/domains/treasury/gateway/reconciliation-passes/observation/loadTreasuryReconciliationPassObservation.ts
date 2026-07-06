import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { loadTreasuryReconciliationPassObservationWithClient } from "./loadTreasuryReconciliationPassObservationWithClient";

import type { TreasuryReconciliationPassObservation } from "./contracts";

export async function loadTreasuryReconciliationPassObservation(
  passId: string,
): Promise<TreasuryReconciliationPassObservation | null> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    loadTreasuryReconciliationPassObservationWithClient({
      passId,

      client: tx,
    }),
  );
}
