import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { authorizeTreasuryExecutionDurablyWithClient } from "./authorizeTreasuryExecutionDurablyWithClient";

import type { AuthorizeTreasuryExecution } from "../commands";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { PersistedTreasuryExecutionTransition } from "../persistence/contracts";

import type { TreasuryExecutionAuthorizedPayload } from "../events";

export async function authorizeTreasuryExecutionDurably(params: {
  command: AuthorizeTreasuryExecution;

  eventId: TreasuryEventId;
}): Promise<
  PersistedTreasuryExecutionTransition<TreasuryExecutionAuthorizedPayload>
> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    authorizeTreasuryExecutionDurablyWithClient({
      ...params,

      client: tx,
    }),
  );
}
