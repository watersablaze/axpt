import { findTreasuryExecutionReconciliationCandidates } from "../persistence/findTreasuryExecutionReconciliationCandidates";

import { reconcileTreasuryExecutionByDispatchOwnershipDurably } from "./reconcileTreasuryExecutionByDispatchOwnershipDurably";

import { runTreasuryExecutionReconciliationBatchWithDependencies } from "./runTreasuryExecutionReconciliationBatchWithDependencies";

import type { TreasuryCommandContext } from "../../shared/commandContext";

import type { TreasuryExecutionReconciliationBatchResult } from "./runTreasuryExecutionReconciliationBatchContracts";

export async function runTreasuryExecutionReconciliationBatch(params: {
  limit: number;

  context: TreasuryCommandContext;
}): Promise<TreasuryExecutionReconciliationBatchResult> {
  return runTreasuryExecutionReconciliationBatchWithDependencies({
    ...params,

    findCandidates: findTreasuryExecutionReconciliationCandidates,

    reconcileExecution: reconcileTreasuryExecutionByDispatchOwnershipDurably,
  });
}
