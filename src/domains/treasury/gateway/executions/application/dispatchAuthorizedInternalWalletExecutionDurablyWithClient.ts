import type { TransactionClient } from "@prisma/client";

import { dispatchAndAcknowledgeInternalWalletExecutionWithClient } from "../adapters/internal-wallet/dispatchAndAcknowledgeInternalWalletExecutionWithClient";

import { prepareAuthorizedTreasuryExecutionHandoff } from "../handoff/prepareAuthorizedTreasuryExecutionHandoff";

import { loadTreasuryExecutionAuthorizationEvidenceWithClient } from "../persistence/loadTreasuryExecutionAuthorizationEvidenceWithClient";

import { loadTreasuryExecutionWithClient } from "../persistence/loadTreasuryExecutionWithClient";

import { persistTreasuryExecutionTransitionWithClient } from "../persistence/persistTreasuryExecutionTransitionWithClient";

import { TREASURY_EXECUTION_ADAPTER_KIND } from "../routing/contracts";

import { resolveTreasuryExecutionRoute } from "../routing/resolveTreasuryExecutionRoute";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryEventId,
  TreasuryExecutionHandoffId,
  TreasuryExecutionId,
} from "../../shared/identifiers";

import type { InternalWalletCapability } from "../routing/contracts";

import type { DurableInternalWalletExecutionDispatchResult } from "./dispatchAuthorizedInternalWalletExecutionDurablyContracts";

export async function dispatchAuthorizedInternalWalletExecutionDurablyWithClient(params: {
  executionId: TreasuryExecutionId;

  handoffId: TreasuryExecutionHandoffId;

  capability: InternalWalletCapability;

  dispatchContext: TreasuryCommandContext;

  acknowledgementEventId: TreasuryEventId;

  acknowledgementContext: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<DurableInternalWalletExecutionDispatchResult> {
  const {
    executionId,
    handoffId,
    capability,
    dispatchContext,
    acknowledgementEventId,
    acknowledgementContext,
    client,
  } = params;

  const loaded = await loadTreasuryExecutionWithClient({
    executionId,

    client,
  });

  if (!loaded) {
    throw new Error(`[TREASURY_GATEWAY_EXECUTION_NOT_FOUND] ${executionId}`);
  }

  const execution = loaded.aggregate;

  const authorizationEvidence =
    await loadTreasuryExecutionAuthorizationEvidenceWithClient({
      executionId,

      executionVersion: execution.metadata.version,

      client,
    });

  if (!authorizationEvidence) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_AUTHORIZATION_EVIDENCE_NOT_FOUND] ${executionId}@${execution.metadata.version}`,
    );
  }

  if (!execution.authorizedAt) {
    throw new Error(
      "[TREASURY_GATEWAY_EXECUTION_AUTHORIZATION_TIMESTAMP_MISSING]",
    );
  }

  if (
    execution.authorizedAt.getTime() !==
    authorizationEvidence.authorizedAt.getTime()
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_AUTHORIZATION_TIMESTAMP_MISMATCH] ${execution.authorizedAt.toISOString()} -> ${authorizationEvidence.authorizedAt.toISOString()}`,
    );
  }

  const handoff = prepareAuthorizedTreasuryExecutionHandoff({
    handoffId,

    execution,

    approvalIds: authorizationEvidence.approvalIds,

    context: dispatchContext,
  });

  const route = resolveTreasuryExecutionRoute({
    handoff,

    capability,
  });

  if (route.status !== "RESOLVED") {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_ROUTE_UNRESOLVED] ${route.reason}`,
    );
  }

  if (route.adapterKind !== TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET) {
    throw new Error(
      `[TREASURY_GATEWAY_EXECUTION_ADAPTER_MISMATCH] ${route.adapterKind}`,
    );
  }

  const composed =
    await dispatchAndAcknowledgeInternalWalletExecutionWithClient({
      execution,

      handoff,

      route,

      acknowledgementContext,

      client,
    });

  const persistedGateway = await persistTreasuryExecutionTransitionWithClient({
    expectedVersion: execution.metadata.version,

    result: composed.gateway,

    eventId: acknowledgementEventId,

    context: acknowledgementContext,

    client,
  });

  return {
    dispatch: composed.dispatch,

    gateway: persistedGateway,
  };
}
