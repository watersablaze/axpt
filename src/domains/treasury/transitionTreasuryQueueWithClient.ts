import type { PrismaClient, TransactionClient } from "@prisma/client";

import { assertTreasuryQueueTransition } from "./assertTransition";

import type { TreasuryQueueStatus } from "./stateMachine";

export type TreasuryQueueTransitionClient = PrismaClient | TransactionClient;

export async function transitionTreasuryQueueWithClient(params: {
  id: string;

  to: TreasuryQueueStatus;

  client: TreasuryQueueTransitionClient;

  data?: Record<string, unknown>;
}) {
  const { id, to, client, data } = params;

  const current = await client.treasuryExecutionQueue.findUnique({
    where: {
      id,
    },

    select: {
      status: true,
    },
  });

  if (!current) {
    throw new Error("Treasury queue job not found");
  }

  assertTreasuryQueueTransition(current.status as TreasuryQueueStatus, to);

  const updated = await client.treasuryExecutionQueue.updateMany({
    where: {
      id,
      status: current.status,
    },

    data: {
      status: to,

      ...(data ?? {}),
    } as any,
  });

  if (updated.count === 0) {
    throw new Error("Treasury queue transition race detected");
  }

  return client.treasuryExecutionQueue.findUnique({
    where: {
      id,
    },
  });
}
