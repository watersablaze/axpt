import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { dispatchAndAcknowledgeInternalWalletExecutionWithClient } from "./dispatchAndAcknowledgeInternalWalletExecutionWithClient";

import type { TreasuryCommandContext } from "../../../shared/commandContext";

import type { TreasuryExecution } from "../../contracts";

import type { TreasuryExecutionHandoff } from "../../handoff/contracts";

import type { ResolvedTreasuryExecutionRoute } from "../../routing/contracts";

import type { DispatchAndAcknowledgeInternalWalletExecutionResult } from "./dispatchAndAcknowledgeContracts";

export async function dispatchAndAcknowledgeInternalWalletExecution(params: {
  execution: TreasuryExecution;

  handoff: TreasuryExecutionHandoff;

  route: ResolvedTreasuryExecutionRoute;

  acknowledgementContext: TreasuryCommandContext;
}): Promise<DispatchAndAcknowledgeInternalWalletExecutionResult> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    dispatchAndAcknowledgeInternalWalletExecutionWithClient({
      ...params,
      client: tx,
    }),
  );
}
