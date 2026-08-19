import type { TransferExecutionPerception } from "../../treasury/gateway/transfer-execution-summary/perceptionContracts";

import type { TreasuryTransfer } from "../../treasury/gateway/transfers/contracts";

import {
  toControlCenterTransferExecutionSummary,
  type ControlCenterTransferExecutionSummary,
} from "./transferExecutionSummary";

export type ControlCenterPreExecutionTransfer = Readonly<{
  id: string;

  reference: string;

  status: string;

  version: number;

  programId: string;

  instructionId?: string;

  requestedAmount: Readonly<{
    amount: string;

    currency: string;
  }>;

  destinationCurrency: string;

  purpose: string;

  createdAt: string;

  updatedAt: string;
}>;

export type ControlCenterTransferExecutionPerception =
  | Readonly<{
      kind: "PRE_EXECUTION";

      transfer: ControlCenterPreExecutionTransfer;
    }>
  | Readonly<{
      kind: "EXECUTION_SUMMARY";

      summary: ControlCenterTransferExecutionSummary;
    }>;

function toControlCenterPreExecutionTransfer(
  transfer: TreasuryTransfer,
): ControlCenterPreExecutionTransfer {
  return {
    id: transfer.id,

    reference: transfer.reference,

    status: transfer.status,

    version: transfer.metadata.version,

    programId: transfer.programId,

    instructionId: transfer.instructionId,

    requestedAmount: {
      ...transfer.requestedAmount,
    },

    destinationCurrency: transfer.destinationCurrency,

    purpose: transfer.purpose,

    createdAt: transfer.metadata.createdAt.toISOString(),

    updatedAt: transfer.metadata.updatedAt.toISOString(),
  };
}

export function toControlCenterTransferExecutionPerception(
  perception: TransferExecutionPerception,
): ControlCenterTransferExecutionPerception {
  if (perception.kind === "PRE_EXECUTION") {
    return {
      kind: "PRE_EXECUTION",

      transfer: toControlCenterPreExecutionTransfer(perception.transfer),
    };
  }

  return {
    kind: "EXECUTION_SUMMARY",

    summary: toControlCenterTransferExecutionSummary(perception.summary),
  };
}
