import type { TreasuryExecutionReconciliationBatchSummary } from "../../executions/application/runTreasuryExecutionReconciliationBatchContracts";

import type { TreasuryEventType } from "../../events/eventType";

import type { TreasuryReconciliationPassFailure } from "../contracts";

import type { TreasuryReconciliationPassStatus } from "../status";

export type TreasuryReconciliationPassLifecycleObservation = Readonly<{
  version: number;

  eventType: TreasuryEventType;

  occurredAt: Date;

  recordedAt: Date;

  actorId?: string;

  authorityGrantId?: string;
}>;

export type TreasuryReconciliationPassObservation = Readonly<{
  passId: string;

  status: TreasuryReconciliationPassStatus;

  requestedLimit: number;

  requestedAt: Date;

  startedAt?: Date;

  completedAt?: Date;

  version: number;

  summary?: TreasuryExecutionReconciliationBatchSummary;

  failure?: TreasuryReconciliationPassFailure;

  lifecycle: readonly TreasuryReconciliationPassLifecycleObservation[];

  observedAt: Date;
}>;
