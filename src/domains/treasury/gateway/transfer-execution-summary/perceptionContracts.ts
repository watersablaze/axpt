import type { TreasuryTransfer } from "../transfers/contracts";

import type { TransferExecutionSummary } from "./contracts";

export type TransferExecutionPreExecutionPerception = Readonly<{
  kind: "PRE_EXECUTION";

  transfer: TreasuryTransfer;
}>;

export type TransferExecutionSummaryPerception = Readonly<{
  kind: "EXECUTION_SUMMARY";

  summary: TransferExecutionSummary;
}>;

export type TransferExecutionPerception =
  | TransferExecutionPreExecutionPerception
  | TransferExecutionSummaryPerception;
