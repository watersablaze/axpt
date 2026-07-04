import type { PrismaClient, TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { transitionTreasuryQueueWithClient } from "./transitionTreasuryQueueWithClient";

import type { TreasuryQueueStatus } from "./stateMachine";

export async function transitionTreasuryQueue(params: {
  id: string;

  to: TreasuryQueueStatus;

  client?: PrismaClient | TransactionClient;

  data?: Record<string, unknown>;
}) {
  const { client = prisma, ...transition } = params;

  return transitionTreasuryQueueWithClient({
    ...transition,
    client,
  });
}
