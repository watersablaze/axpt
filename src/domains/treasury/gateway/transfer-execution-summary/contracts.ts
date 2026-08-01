import type {
  TreasuryExecutionPlanId,
  TreasuryTransferId,
} from "../shared/identifiers";

import type { TreasuryMoney } from "../shared/money";

import type { TreasuryExecutionPlanStatus } from "../execution-plans/status";

import type { TreasuryExecutionStatus } from "../executions/status";

import type { TreasuryTransferStatus } from "../transfers/status";

export type TransferExecutionTrancheCounts = Readonly<{
  total: number;

  planned: number;

  eligible: number;

  ineligible: number;

  requiresClarification: number;

  boundToExecution: number;
}>;

export type TransferExecutionStatusCounts = Readonly<
  Record<TreasuryExecutionStatus, number>
>;

export type TransferExecutionAmountSummary = Readonly<{
  planned: TreasuryMoney;

  bound: TreasuryMoney;

  confirmed: TreasuryMoney;

  failed: TreasuryMoney;

  remainingUnbound: TreasuryMoney;
}>;

export type TransferExecutionSummary = Readonly<{
  transferId: TreasuryTransferId;

  transferStatus: TreasuryTransferStatus;

  transferVersion: number;

  planId: TreasuryExecutionPlanId;

  planStatus: TreasuryExecutionPlanStatus;

  planVersion: number;

  trancheCounts: TransferExecutionTrancheCounts;

  executionCounts: TransferExecutionStatusCounts;

  amounts: TransferExecutionAmountSummary;

  lastUpdatedAt: Date;
}>;
