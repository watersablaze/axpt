import type { TransactionClient } from "@prisma/client";

import { acknowledgeTreasuryExecutionQueued } from "../../acknowledgeTreasuryExecutionQueued";

import { dispatchAuthorizedInternalWalletExecutionWithClient } from "./dispatchAuthorizedInternalWalletExecutionWithClient";

import type { TreasuryCommandContext } from "../../../shared/commandContext";

import type { TreasuryExecution } from "../../contracts";

import type { TreasuryExecutionHandoff } from "../../handoff/contracts";

import type { ResolvedTreasuryExecutionRoute } from "../../routing/contracts";

import type { DispatchAndAcknowledgeInternalWalletExecutionResult } from "./dispatchAndAcknowledgeContracts";

export async function dispatchAndAcknowledgeInternalWalletExecutionWithClient(params: {
  execution: TreasuryExecution;

  handoff: TreasuryExecutionHandoff;

  route: ResolvedTreasuryExecutionRoute;

  acknowledgementContext: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<DispatchAndAcknowledgeInternalWalletExecutionResult> {
  const { execution, handoff, route, acknowledgementContext, client } = params;

  if (execution.id !== handoff.executionId) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_HANDOFF_MISMATCH] ${execution.id} -> ${handoff.executionId}`,
    );
  }

  const dispatch = await dispatchAuthorizedInternalWalletExecutionWithClient({
    handoff,
    route,
    client,
  });

  const gateway = acknowledgeTreasuryExecutionQueued(execution, {
    context: acknowledgementContext,

    payload: {
      executionId: execution.id,

      handoffId: route.handoffId,

      adapterKind: route.adapterKind,

      settlementEndpointId: route.capability.settlementEndpointId,

      treasuryActionId: dispatch.treasuryActionId,

      treasuryQueueJobId: dispatch.treasuryQueueJobId,
    },
  });

  return {
    dispatch,
    gateway,
  };
}
