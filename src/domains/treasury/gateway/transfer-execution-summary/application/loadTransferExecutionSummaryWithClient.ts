import type { TransactionClient } from "@prisma/client";

import { EXECUTABLE_TRANCHE_STATUS } from "../../execution-plans/status";

import { loadTreasuryExecutionPlanWithClient } from "../../execution-plans/persistence/loadTreasuryExecutionPlanWithClient";

import { loadTreasuryExecutionsWithClient } from "../../executions/persistence/loadTreasuryExecutionsWithClient";

import type {
  TreasuryExecutionId,
  TreasuryTransferId,
} from "../../shared/identifiers";

import { loadTreasuryTransferPlanningEvidenceWithClient } from "../../transfers/persistence/loadTreasuryTransferPlanningEvidenceWithClient";

import { loadTreasuryTransferWithClient } from "../../transfers/persistence/loadTreasuryTransferWithClient";

import { deriveTransferExecutionSummary } from "../deriveTransferExecutionSummary";

import type { TransferExecutionSummary } from "../contracts";

export async function loadTransferExecutionSummaryWithClient(params: {
  transferId: TreasuryTransferId;

  client: TransactionClient;
}): Promise<TransferExecutionSummary | null> {
  const { transferId, client } = params;

  const loadedTransfer = await loadTreasuryTransferWithClient({
    transferId,

    client,
  });

  if (!loadedTransfer) {
    return null;
  }

  const planningEvidence = await loadTreasuryTransferPlanningEvidenceWithClient(
    {
      transferId,

      transferVersion: loadedTransfer.aggregate.metadata.version,

      client,
    },
  );

  if (!planningEvidence) {
    throw new Error(
      `[TRANSFER_EXECUTION_SUMMARY_PLANNING_EVIDENCE_NOT_FOUND] ${transferId}`,
    );
  }

  const loadedPlan = await loadTreasuryExecutionPlanWithClient({
    planId: planningEvidence.planId,

    client,
  });

  if (!loadedPlan) {
    throw new Error(
      `[TRANSFER_EXECUTION_SUMMARY_PLAN_NOT_FOUND] ${planningEvidence.planId}`,
    );
  }

  if (loadedPlan.aggregate.transferId !== loadedTransfer.aggregate.id) {
    throw new Error(
      `[TRANSFER_EXECUTION_SUMMARY_PLAN_TRANSFER_MISMATCH] ${loadedPlan.aggregate.transferId} -> ${loadedTransfer.aggregate.id}`,
    );
  }

  const executionIds = loadedPlan.aggregate.tranches.flatMap(
    (tranche): readonly TreasuryExecutionId[] => {
      if (tranche.status !== EXECUTABLE_TRANCHE_STATUS.BOUND_TO_EXECUTION) {
        return [];
      }

      if (!tranche.executionId) {
        throw new Error(
          `[TRANSFER_EXECUTION_SUMMARY_BOUND_TRANCHE_EXECUTION_REQUIRED] ${tranche.id}`,
        );
      }

      return [tranche.executionId];
    },
  );

  const loadedExecutions = await loadTreasuryExecutionsWithClient({
    executionIds,

    client,
  });

  return deriveTransferExecutionSummary({
    transfer: loadedTransfer.aggregate,

    plan: loadedPlan.aggregate,

    executions: loadedExecutions.map((loaded) => loaded.aggregate),
  });
}
