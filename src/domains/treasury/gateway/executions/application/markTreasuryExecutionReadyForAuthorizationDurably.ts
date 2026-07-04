import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { markTreasuryExecutionReadyForAuthorizationDurablyWithClient } from "./markTreasuryExecutionReadyForAuthorizationDurablyWithClient";

import type { MarkTreasuryExecutionReadyForAuthorization } from "../commands";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { PersistedTreasuryExecutionTransition } from "../persistence/contracts";

import type { TreasuryExecutionReadyForAuthorizationPayload } from "../events";

export async function markTreasuryExecutionReadyForAuthorizationDurably(params: {
  command: MarkTreasuryExecutionReadyForAuthorization;

  eventId: TreasuryEventId;
}): Promise<
  PersistedTreasuryExecutionTransition<TreasuryExecutionReadyForAuthorizationPayload>
> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    markTreasuryExecutionReadyForAuthorizationDurablyWithClient({
      ...params,

      client: tx,
    }),
  );
}
