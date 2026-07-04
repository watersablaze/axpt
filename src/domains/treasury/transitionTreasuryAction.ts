import type { PrismaClient, TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { transitionTreasuryActionWithClient } from "./transitionTreasuryActionWithClient";

import type { TreasuryActionStatus } from "./stateMachine";

export async function transitionTreasuryAction(params: {
  id: string;

  to: TreasuryActionStatus;

  client?: PrismaClient | TransactionClient;

  data?: Record<string, unknown>;

  metadata?: Record<string, unknown>;
}) {
  const { client = prisma, ...transition } = params;

  return transitionTreasuryActionWithClient({
    ...transition,
    client,
  });
}
