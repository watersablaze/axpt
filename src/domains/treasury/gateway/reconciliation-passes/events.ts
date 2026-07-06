import type { TreasuryExecutionReconciliationBatchSummary } from "../executions/application/runTreasuryExecutionReconciliationBatchContracts";

export type TreasuryReconciliationPassRequestedPayload = Readonly<{
  passId: string;

  requestedLimit: number;

  requestedAt: Date;
}>;

export type TreasuryReconciliationPassStartedPayload = Readonly<{
  passId: string;

  startedAt: Date;
}>;

export type TreasuryReconciliationPassCompletedPayload = Readonly<{
  passId: string;

  summary: TreasuryExecutionReconciliationBatchSummary;

  completedAt: Date;
}>;

export type TreasuryReconciliationPassFailedPayload = Readonly<{
  passId: string;

  errorCode: string;

  errorMessage: string;

  failedAt: Date;
}>;
