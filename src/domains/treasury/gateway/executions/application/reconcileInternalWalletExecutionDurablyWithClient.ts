import type { TransactionClient } from "@prisma/client";

import { loadInternalWalletExecutionConfirmedEvidenceWithClient } from "../adapters/internal-wallet/loadInternalWalletExecutionConfirmedEvidenceWithClient";

import { loadInternalWalletExecutionInitiatedEvidenceWithClient } from "../adapters/internal-wallet/loadInternalWalletExecutionInitiatedEvidenceWithClient";

import { loadTreasuryExecutionWithClient } from "../persistence/loadTreasuryExecutionWithClient";

import { TREASURY_EXECUTION_STATUS } from "../status";

import { confirmTreasuryExecutionDurablyWithClient } from "./confirmTreasuryExecutionDurablyWithClient";

import { markTreasuryExecutionInitiatedDurablyWithClient } from "./markTreasuryExecutionInitiatedDurablyWithClient";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryEventId,
  TreasuryExecutionId,
} from "../../shared/identifiers";

import type { ReconciledInternalWalletExecution } from "./reconcileInternalWalletExecutionDurablyContracts";

export async function reconcileInternalWalletExecutionDurablyWithClient(params: {
  executionId: TreasuryExecutionId;

  initiatedEventId: TreasuryEventId;

  confirmedEventId: TreasuryEventId;

  context: TreasuryCommandContext;

  client: TransactionClient;
}): Promise<ReconciledInternalWalletExecution> {
  const { executionId, initiatedEventId, confirmedEventId, context, client } =
    params;

  const loaded = await loadTreasuryExecutionWithClient({
    executionId,

    client,
  });

  if (!loaded) {
    throw new Error(`[TREASURY_GATEWAY_EXECUTION_NOT_FOUND] ${executionId}`);
  }

  let aggregate = loaded.aggregate;

  let initiated: ReconciledInternalWalletExecution["initiated"] = null;

  let confirmed: ReconciledInternalWalletExecution["confirmed"] = null;

  if (aggregate.status === TREASURY_EXECUTION_STATUS.CONFIRMED) {
    return {
      aggregate,

      initiated,

      confirmed,
    };
  }

  if (aggregate.status === TREASURY_EXECUTION_STATUS.QUEUED) {
    const initiatedEvidence =
      await loadInternalWalletExecutionInitiatedEvidenceWithClient({
        executionId,

        observedAt: context.requestedAt,

        client,
      });

    if (!initiatedEvidence) {
      return {
        aggregate,

        initiated,

        confirmed,
      };
    }

    initiated = await markTreasuryExecutionInitiatedDurablyWithClient({
      command: {
        context,

        payload: {
          executionId,

          treasuryActionId: initiatedEvidence.treasuryActionId,

          treasuryActionStatus: initiatedEvidence.treasuryActionStatus,

          idempotencyKey: initiatedEvidence.idempotencyKey,

          initiatedAt: initiatedEvidence.observedAt,
        },
      },

      eventId: initiatedEventId,

      client,
    });

    aggregate = initiated.aggregate;
  }

  if (aggregate.status === TREASURY_EXECUTION_STATUS.INITIATED) {
    const confirmedEvidence =
      await loadInternalWalletExecutionConfirmedEvidenceWithClient({
        executionId,

        confirmedAt: context.requestedAt,

        client,
      });

    if (!confirmedEvidence) {
      return {
        aggregate,

        initiated,

        confirmed,
      };
    }

    confirmed = await confirmTreasuryExecutionDurablyWithClient({
      command: {
        context,

        payload: {
          executionId,

          treasuryActionId: confirmedEvidence.treasuryActionId,

          idempotencyKey: confirmedEvidence.idempotencyKey,

          debitTransactionId: confirmedEvidence.debitTransactionId,

          creditTransactionId: confirmedEvidence.creditTransactionId,

          assetCode: confirmedEvidence.assetCode,

          amountBaseUnits: confirmedEvidence.amountBaseUnits,

          confirmedAt: confirmedEvidence.confirmedAt,
        },
      },

      eventId: confirmedEventId,

      client,
    });

    aggregate = confirmed.aggregate;
  }

  if (
    aggregate.status !== TREASURY_EXECUTION_STATUS.QUEUED &&
    aggregate.status !== TREASURY_EXECUTION_STATUS.INITIATED &&
    aggregate.status !== TREASURY_EXECUTION_STATUS.CONFIRMED
  ) {
    throw new Error(
      `[TREASURY_GATEWAY_INTERNAL_WALLET_RECONCILIATION_STATUS_UNSUPPORTED] ${aggregate.status}`,
    );
  }

  return {
    aggregate,

    initiated,

    confirmed,
  };
}
