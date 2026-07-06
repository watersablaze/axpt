import type { TransactionClient } from "@prisma/client";

import { loadTreasuryExecutionWithClient } from "../persistence/loadTreasuryExecutionWithClient";

import { loadTreasuryExecutionDispatchOwnershipEvidenceWithClient } from "../persistence/loadTreasuryExecutionDispatchOwnershipEvidenceWithClient";

import { TREASURY_EXECUTION_ADAPTER_KIND } from "../routing/contracts";

import { reconcileInternalWalletExecutionDurablyWithClient } from "./reconcileInternalWalletExecutionDurablyWithClient";

import { TREASURY_EXECUTION_RECONCILIATION_OUTCOME } from "./reconcileTreasuryExecutionByDispatchOwnershipContracts";
import type { TreasuryExecutionReconciliationOutcome } from "./reconcileTreasuryExecutionByDispatchOwnershipContracts";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryEventId,
  TreasuryExecutionId,
} from "../../shared/identifiers";

import type { ReconcileTreasuryExecutionByDispatchOwnershipResult } from "./reconcileTreasuryExecutionByDispatchOwnershipContracts";

export async function reconcileTreasuryExecutionByDispatchOwnershipDurablyWithClient(params: {
  executionId: TreasuryExecutionId;

  initiatedEventId: TreasuryEventId;

  confirmedEventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<ReconcileTreasuryExecutionByDispatchOwnershipResult> {
  const { executionId, initiatedEventId, confirmedEventId, context, client } =
    params;

  const loaded = await loadTreasuryExecutionWithClient({
    executionId,

    client,
  });

  if (!loaded) {
    throw new Error(`[TREASURY_GATEWAY_EXECUTION_NOT_FOUND] ${executionId}`);
  }

  const beforeStatus = loaded.aggregate.status;

  const beforeVersion = loaded.aggregate.metadata.version;

  const ownership =
    await loadTreasuryExecutionDispatchOwnershipEvidenceWithClient({
      executionId,

      executionVersion: beforeVersion,

      client,
    });

  if (!ownership) {
    return {
      executionId,

      outcome: TREASURY_EXECUTION_RECONCILIATION_OUTCOME.OWNERSHIP_NOT_FOUND,

      beforeStatus,

      afterStatus: beforeStatus,

      beforeVersion,

      afterVersion: beforeVersion,

      ownership: null,

      internalWallet: null,
    };
  }

  if (
    ownership.adapterKind !== TREASURY_EXECUTION_ADAPTER_KIND.INTERNAL_WALLET
  ) {
    return {
      executionId,

      outcome:
        TREASURY_EXECUTION_RECONCILIATION_OUTCOME.ADAPTER_NOT_IMPLEMENTED,

      adapterKind: ownership.adapterKind,

      beforeStatus,

      afterStatus: beforeStatus,

      beforeVersion,

      afterVersion: beforeVersion,

      ownership,

      internalWallet: null,
    };
  }

  const internalWallet =
    await reconcileInternalWalletExecutionDurablyWithClient({
      executionId,

      initiatedEventId,

      confirmedEventId,

      context,

      client,
    });

  const afterStatus = internalWallet.aggregate.status;

  const afterVersion = internalWallet.aggregate.metadata.version;

  let outcome: TreasuryExecutionReconciliationOutcome =
    TREASURY_EXECUTION_RECONCILIATION_OUTCOME.NO_CHANGE;

  if (internalWallet.initiated && internalWallet.confirmed) {
    outcome =
      TREASURY_EXECUTION_RECONCILIATION_OUTCOME.ADVANCED_TO_INITIATED_AND_CONFIRMED;
  } else if (internalWallet.confirmed) {
    outcome = TREASURY_EXECUTION_RECONCILIATION_OUTCOME.ADVANCED_TO_CONFIRMED;
  } else if (internalWallet.initiated) {
    outcome = TREASURY_EXECUTION_RECONCILIATION_OUTCOME.ADVANCED_TO_INITIATED;
  }

  return {
    executionId,

    outcome,

    adapterKind: ownership.adapterKind,

    beforeStatus,

    afterStatus,

    beforeVersion,

    afterVersion,

    ownership,

    internalWallet,
  };
}
