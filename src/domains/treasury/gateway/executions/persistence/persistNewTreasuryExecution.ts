import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { persistNewTreasuryExecutionWithClient } from "./persistNewTreasuryExecutionWithClient";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { TreasuryEventId } from "../../shared/identifiers";

import type { TreasuryDomainResult } from "../../shared/domainResult";

import type { TreasuryExecution } from "../contracts";

import type { TreasuryExecutionCreatedPayload } from "../events";

import type { PersistedNewTreasuryExecution } from "./contracts";

export async function persistNewTreasuryExecution(params: {
  result: TreasuryDomainResult<
    TreasuryExecution,
    TreasuryExecutionCreatedPayload
  >;

  eventId: TreasuryEventId;

  context: TreasuryCommandContext;
}): Promise<PersistedNewTreasuryExecution> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    persistNewTreasuryExecutionWithClient({
      ...params,

      client: tx,
    }),
  );
}
