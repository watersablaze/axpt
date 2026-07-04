import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { persistTreasuryExecutionTransitionWithClient } from "./persistTreasuryExecutionTransitionWithClient";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { TreasuryDomainResult } from "../../shared/domainResult";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { TreasuryExecution } from "../contracts";

import type { PersistedTreasuryExecutionTransition } from "./contracts";

export async function persistTreasuryExecutionTransition<TPayload>(params: {
  expectedVersion: number;

  result: TreasuryDomainResult<TreasuryExecution, TPayload>;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;
}): Promise<PersistedTreasuryExecutionTransition<TPayload>> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    persistTreasuryExecutionTransitionWithClient({
      ...params,

      client: tx,
    }),
  );
}
