import type { TransactionClient } from "@prisma/client";

import { prisma } from "@/infrastructure/db/prisma";

import { dispatchAuthorizedInternalWalletExecutionDurablyWithClient } from "./dispatchAuthorizedInternalWalletExecutionDurablyWithClient";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryEventId,
  TreasuryExecutionHandoffId,
  TreasuryExecutionId,
} from "../../shared/identifiers";

import type { InternalWalletCapability } from "../routing/contracts";

import type { DurableInternalWalletExecutionDispatchResult } from "./dispatchAuthorizedInternalWalletExecutionDurablyContracts";

export async function dispatchAuthorizedInternalWalletExecutionDurably(params: {
  executionId: TreasuryExecutionId;

  handoffId: TreasuryExecutionHandoffId;

  capability: InternalWalletCapability;

  dispatchContext: TreasuryCommandContext;

  acknowledgementEventId: TreasuryEventId;

  acknowledgementContext: TreasuryCommandContext;
}): Promise<DurableInternalWalletExecutionDispatchResult> {
  return prisma.$transaction(async (tx: TransactionClient) =>
    dispatchAuthorizedInternalWalletExecutionDurablyWithClient({
      ...params,

      client: tx,
    }),
  );
}
