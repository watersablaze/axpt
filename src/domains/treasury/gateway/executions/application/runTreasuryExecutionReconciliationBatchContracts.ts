import type { ReconcileTreasuryExecutionByDispatchOwnershipResult } from "./reconcileTreasuryExecutionByDispatchOwnershipContracts";

export const TREASURY_EXECUTION_BATCH_ITEM_STATUS = {
  RECONCILED: "RECONCILED",

  FAILED: "FAILED",
} as const;

export type TreasuryExecutionBatchItemStatus =
  (typeof TREASURY_EXECUTION_BATCH_ITEM_STATUS)[keyof typeof TREASURY_EXECUTION_BATCH_ITEM_STATUS];

export type ReconciledTreasuryExecutionBatchItem = Readonly<{
  status: typeof TREASURY_EXECUTION_BATCH_ITEM_STATUS.RECONCILED;

  executionId: string;

  result: ReconcileTreasuryExecutionByDispatchOwnershipResult;
}>;

export type FailedTreasuryExecutionBatchItem = Readonly<{
  status: typeof TREASURY_EXECUTION_BATCH_ITEM_STATUS.FAILED;

  executionId: string;

  errorCode: string;

  errorMessage: string;
}>;

export type TreasuryExecutionReconciliationBatchItem =
  | ReconciledTreasuryExecutionBatchItem
  | FailedTreasuryExecutionBatchItem;

export type TreasuryExecutionReconciliationBatchSummary = Readonly<{
  discovered: number;

  processed: number;

  reconciled: number;

  failed: number;

  advanced: number;

  unchanged: number;

  unsupported: number;

  ownershipMissing: number;
}>;

export type TreasuryExecutionReconciliationBatchResult = Readonly<{
  items: readonly TreasuryExecutionReconciliationBatchItem[];

  summary: TreasuryExecutionReconciliationBatchSummary;
}>;
