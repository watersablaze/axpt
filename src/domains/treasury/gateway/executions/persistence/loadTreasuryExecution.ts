import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { loadTreasuryExecutionWithClient } from "./loadTreasuryExecutionWithClient";

import type { TreasuryExecutionId } from "../../shared/identifiers";

import type { LoadedTreasuryExecution } from "./contracts";

export async function loadTreasuryExecution(
  executionId: TreasuryExecutionId,
): Promise<LoadedTreasuryExecution | null> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    loadTreasuryExecutionWithClient({
      executionId,

      client: tx,
    }),
  );
}
