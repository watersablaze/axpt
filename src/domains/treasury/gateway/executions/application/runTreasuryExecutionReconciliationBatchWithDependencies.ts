import { randomUUID } from "node:crypto";

import {
  TREASURY_EXECUTION_RECONCILIATION_OUTCOME,
  type ReconcileTreasuryExecutionByDispatchOwnershipResult,
  type TreasuryExecutionReconciliationOutcome,
} from "./reconcileTreasuryExecutionByDispatchOwnershipContracts";

import {
  TREASURY_EXECUTION_BATCH_ITEM_STATUS,
  type FailedTreasuryExecutionBatchItem,
  type ReconciledTreasuryExecutionBatchItem,
  type TreasuryExecutionReconciliationBatchItem,
  type TreasuryExecutionReconciliationBatchResult,
} from "./runTreasuryExecutionReconciliationBatchContracts";

import type { LoadedTreasuryExecution } from "../persistence/contracts";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type {
  TreasuryEventId,
  TreasuryExecutionId,
} from "../../shared/identifiers";

type FindReconciliationCandidates = (params: {
  limit: number;
}) => Promise<readonly LoadedTreasuryExecution[]>;

type ReconcileExecution = (params: {
  executionId: TreasuryExecutionId;

  initiatedEventId: TreasuryEventId;

  confirmedEventId: TreasuryEventId;

  context: TreasuryCommandContext;
}) => Promise<ReconcileTreasuryExecutionByDispatchOwnershipResult>;

function extractError(error: unknown): Readonly<{
  errorCode: string;

  errorMessage: string;
}> {
  if (error instanceof Error) {
    const codeMatch = error.message.match(/\[([A-Z0-9_]+)\]/);

    return {
      errorCode: codeMatch?.[1] ?? "TREASURY_EXECUTION_RECONCILIATION_FAILED",

      errorMessage: error.message,
    };
  }

  return {
    errorCode: "TREASURY_EXECUTION_RECONCILIATION_FAILED",

    errorMessage: String(error),
  };
}

function isAdvancedOutcome(
  outcome: TreasuryExecutionReconciliationOutcome,
): boolean {
  return (
    outcome ===
      TREASURY_EXECUTION_RECONCILIATION_OUTCOME.ADVANCED_TO_INITIATED ||
    outcome ===
      TREASURY_EXECUTION_RECONCILIATION_OUTCOME.ADVANCED_TO_CONFIRMED ||
    outcome ===
      TREASURY_EXECUTION_RECONCILIATION_OUTCOME.ADVANCED_TO_INITIATED_AND_CONFIRMED
  );
}

export async function runTreasuryExecutionReconciliationBatchWithDependencies(params: {
  limit: number;

  context: TreasuryCommandContext;

  findCandidates: FindReconciliationCandidates;

  reconcileExecution: ReconcileExecution;
}): Promise<TreasuryExecutionReconciliationBatchResult> {
  const { limit, context, findCandidates, reconcileExecution } = params;

  const candidates = await findCandidates({
    limit,
  });

  const items: TreasuryExecutionReconciliationBatchItem[] = [];

  for (const candidate of candidates) {
    const reconciliationId = randomUUID();

    try {
      const result = await reconcileExecution({
        executionId: candidate.aggregate.id,

        initiatedEventId: `event-reconcile-initiated-${reconciliationId}`,

        confirmedEventId: `event-reconcile-confirmed-${reconciliationId}`,

        context: {
          ...context,

          commandId: `${context.commandId}:${candidate.aggregate.id}`,

          causationId: context.commandId,

          requestedAt: new Date(),

          idempotencyKey: `${context.idempotencyKey}:${candidate.aggregate.id}`,
        },
      });

      items.push({
        status: TREASURY_EXECUTION_BATCH_ITEM_STATUS.RECONCILED,

        executionId: candidate.aggregate.id,

        result,
      });
    } catch (error: unknown) {
      const { errorCode, errorMessage } = extractError(error);

      items.push({
        status: TREASURY_EXECUTION_BATCH_ITEM_STATUS.FAILED,

        executionId: candidate.aggregate.id,

        errorCode,

        errorMessage,
      });
    }
  }

  const reconciledItems = items.filter(
    (item): item is ReconciledTreasuryExecutionBatchItem =>
      item.status === TREASURY_EXECUTION_BATCH_ITEM_STATUS.RECONCILED,
  );

  const failedItems = items.filter(
    (item): item is FailedTreasuryExecutionBatchItem =>
      item.status === TREASURY_EXECUTION_BATCH_ITEM_STATUS.FAILED,
  );

  const outcomes = reconciledItems.map((item) => item.result.outcome);

  return {
    items,

    summary: {
      discovered: candidates.length,

      processed: items.length,

      reconciled: reconciledItems.length,

      failed: failedItems.length,

      advanced: outcomes.filter(isAdvancedOutcome).length,

      unchanged: outcomes.filter(
        (outcome) =>
          outcome === TREASURY_EXECUTION_RECONCILIATION_OUTCOME.NO_CHANGE,
      ).length,

      unsupported: outcomes.filter(
        (outcome) =>
          outcome ===
          TREASURY_EXECUTION_RECONCILIATION_OUTCOME.ADAPTER_NOT_IMPLEMENTED,
      ).length,

      ownershipMissing: outcomes.filter(
        (outcome) =>
          outcome ===
          TREASURY_EXECUTION_RECONCILIATION_OUTCOME.OWNERSHIP_NOT_FOUND,
      ).length,
    },
  };
}
