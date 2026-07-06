import type { TreasuryExecutionReconciliationBatchSummary } from "../executions/application/runTreasuryExecutionReconciliationBatchContracts";

import type { TreasuryReconciliationPassStatus } from "./status";

export type TreasuryReconciliationPassFailure = Readonly<{
  errorCode: string;

  errorMessage: string;
}>;

export type TreasuryReconciliationPassMetadata = Readonly<{
  createdAt: Date;

  updatedAt: Date;

  version: number;

  lastModifiedByActorId: string;
}>;

export type TreasuryReconciliationPass = Readonly<{
  id: string;

  requestedLimit: number;

  status: TreasuryReconciliationPassStatus;

  requestedAt: Date;

  startedAt?: Date;

  completedAt?: Date;

  summary?: TreasuryExecutionReconciliationBatchSummary;

  failure?: TreasuryReconciliationPassFailure;

  metadata: TreasuryReconciliationPassMetadata;
}>;
