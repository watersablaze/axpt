import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { beginTreasuryExecutionValidationDurablyWithClient } from "./beginTreasuryExecutionValidationDurablyWithClient";

import type { BeginTreasuryExecutionValidation } from "../commands";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { PersistedTreasuryExecutionTransition } from "../persistence/contracts";

import type { TreasuryExecutionValidationStartedPayload } from "../events";

export async function beginTreasuryExecutionValidationDurably(params: {
  command: BeginTreasuryExecutionValidation;

  eventId: TreasuryEventId;
}): Promise<
  PersistedTreasuryExecutionTransition<TreasuryExecutionValidationStartedPayload>
> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    beginTreasuryExecutionValidationDurablyWithClient({
      ...params,

      client: tx,
    }),
  );
}
