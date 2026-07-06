import type { TreasuryExecutionStatus } from "../status";

import type { TreasuryExecutionAdapterKind } from "../routing/contracts";

import type { LoadedTreasuryExecutionDispatchOwnershipEvidence } from "../persistence/contracts";

import type { ReconciledInternalWalletExecution } from "./reconcileInternalWalletExecutionDurablyContracts";

export const TREASURY_EXECUTION_RECONCILIATION_OUTCOME = {
  OWNERSHIP_NOT_FOUND: "OWNERSHIP_NOT_FOUND",

  ADAPTER_NOT_IMPLEMENTED: "ADAPTER_NOT_IMPLEMENTED",

  NO_CHANGE: "NO_CHANGE",

  ADVANCED_TO_INITIATED: "ADVANCED_TO_INITIATED",

  ADVANCED_TO_CONFIRMED: "ADVANCED_TO_CONFIRMED",

  ADVANCED_TO_INITIATED_AND_CONFIRMED: "ADVANCED_TO_INITIATED_AND_CONFIRMED",
} as const;

export type TreasuryExecutionReconciliationOutcome =
  (typeof TREASURY_EXECUTION_RECONCILIATION_OUTCOME)[keyof typeof TREASURY_EXECUTION_RECONCILIATION_OUTCOME];

export type ReconcileTreasuryExecutionByDispatchOwnershipResult = Readonly<{
  executionId: string;

  outcome: TreasuryExecutionReconciliationOutcome;

  adapterKind?: TreasuryExecutionAdapterKind;

  beforeStatus: TreasuryExecutionStatus;

  afterStatus: TreasuryExecutionStatus;

  beforeVersion: number;

  afterVersion: number;

  ownership: LoadedTreasuryExecutionDispatchOwnershipEvidence | null;

  internalWallet: ReconciledInternalWalletExecution | null;
}>;
