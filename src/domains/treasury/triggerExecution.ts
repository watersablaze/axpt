import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { triggerTreasuryExecutionWithClient } from "./triggerExecutionWithClient";

import type { TreasuryExecutionTriggerClient } from "./triggerExecutionWithClient";

export async function triggerTreasuryExecution(
  actionId: string,
  client?: TreasuryExecutionTriggerClient,
) {
  if (client) {
    return triggerTreasuryExecutionWithClient(actionId, client);
  }

  return prisma.$transaction(async (tx: TransactionClient) =>
    triggerTreasuryExecutionWithClient(actionId, tx),
  );
}
