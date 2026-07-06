import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { findTreasuryReconciliationPassObservationsWithClient } from "./findTreasuryReconciliationPassObservationsWithClient";

import type { TreasuryReconciliationPassObservation } from "./contracts";

export async function findTreasuryReconciliationPassObservations(params: {
  limit: number;
}): Promise<readonly TreasuryReconciliationPassObservation[]> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    findTreasuryReconciliationPassObservationsWithClient({
      ...params,

      client: tx,
    }),
  );
}
