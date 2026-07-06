import type { TreasuryExecutionReconciliationBatchResult } from "../../executions/application/runTreasuryExecutionReconciliationBatchContracts";

import type { TreasuryReconciliationPass } from "../contracts";

export type CompletedDurableTreasuryReconciliationPass = Readonly<{
  pass: TreasuryReconciliationPass;

  batch: TreasuryExecutionReconciliationBatchResult;
}>;

export type FailedDurableTreasuryReconciliationPass = Readonly<{
  pass: TreasuryReconciliationPass;

  batch: null;
}>;

export type DurableTreasuryReconciliationPassResult =
  | CompletedDurableTreasuryReconciliationPass
  | FailedDurableTreasuryReconciliationPass;
