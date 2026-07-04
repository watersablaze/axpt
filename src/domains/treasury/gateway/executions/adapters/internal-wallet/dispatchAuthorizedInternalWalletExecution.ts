import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { dispatchAuthorizedInternalWalletExecutionWithClient } from "./dispatchAuthorizedInternalWalletExecutionWithClient";

import type { TreasuryExecutionHandoff } from "../../handoff/contracts";

import type { ResolvedTreasuryExecutionRoute } from "../../routing/contracts";

import type { AuthorizedInternalWalletExecutionDispatchResult } from "./dispatchContracts";

export async function dispatchAuthorizedInternalWalletExecution(params: {
  handoff: TreasuryExecutionHandoff;

  route: ResolvedTreasuryExecutionRoute;
}): Promise<AuthorizedInternalWalletExecutionDispatchResult> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    dispatchAuthorizedInternalWalletExecutionWithClient({
      ...params,
      client: tx,
    }),
  );
}
