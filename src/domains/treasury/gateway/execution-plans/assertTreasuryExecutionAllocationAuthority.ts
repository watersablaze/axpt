import type { TreasuryAllocation } from "../allocations/contracts";

import { TREASURY_ALLOCATION_STATUS } from "../allocations/status";

import type { TreasuryExecution } from "../executions/contracts";

import {
  compareDecimals,
  subtractDecimals,
} from "../shared/decimalAmount";

import type { TreasuryTransfer } from "../transfers/contracts";

import { TREASURY_TRANSFER_LOCATION_KIND } from "../transfers/contracts";

export function assertTreasuryExecutionAllocationAuthority(params: {
  allocation: TreasuryAllocation;

  transfer: TreasuryTransfer;

  execution: TreasuryExecution;
}): void {
  const { allocation, transfer, execution } = params;

  if (execution.allocationId !== allocation.id) {
    throw new Error(
      `[TREASURY_EXECUTION_ALLOCATION_ID_MISMATCH] ${execution.allocationId} -> ${allocation.id}`,
    );
  }

  if (allocation.programId !== transfer.programId) {
    throw new Error(
      `[TREASURY_EXECUTION_ALLOCATION_PROGRAM_MISMATCH] ${allocation.programId} -> ${transfer.programId}`,
    );
  }

  if (
    transfer.source.kind !==
    TREASURY_TRANSFER_LOCATION_KIND.PROGRAM_ACCOUNT
  ) {
    throw new Error(
      `[TREASURY_EXECUTION_ALLOCATION_TRANSFER_SOURCE_UNSUPPORTED] ${transfer.source.kind}`,
    );
  }

  if (
    allocation.sourceProgramAccountId !==
    transfer.source.programAccountId
  ) {
    throw new Error(
      `[TREASURY_EXECUTION_ALLOCATION_SOURCE_ACCOUNT_MISMATCH] ${allocation.sourceProgramAccountId} -> ${transfer.source.programAccountId}`,
    );
  }

  if (
    allocation.amount.currency !==
    allocation.consumedAmount.currency
  ) {
    throw new Error(
      `[TREASURY_EXECUTION_ALLOCATION_MONEY_CURRENCY_MISMATCH] ${allocation.amount.currency}/${allocation.consumedAmount.currency}`,
    );
  }

  if (allocation.amount.currency !== execution.amount.currency) {
    throw new Error(
      `[TREASURY_EXECUTION_ALLOCATION_CURRENCY_MISMATCH] ${allocation.amount.currency} -> ${execution.amount.currency}`,
    );
  }

  if (
    allocation.status !== TREASURY_ALLOCATION_STATUS.ACTIVE &&
    allocation.status !==
      TREASURY_ALLOCATION_STATUS.PARTIALLY_CONSUMED
  ) {
    throw new Error(
      `[TREASURY_EXECUTION_ALLOCATION_NOT_CONSUMABLE] ${allocation.status}`,
    );
  }

  if (
    compareDecimals(
      allocation.consumedAmount.amount,
      allocation.amount.amount,
    ) > 0
  ) {
    throw new Error(
      `[TREASURY_EXECUTION_ALLOCATION_CONSUMED_AMOUNT_INVALID] ${allocation.consumedAmount.amount} -> ${allocation.amount.amount}`,
    );
  }

  const remainingAmount = subtractDecimals(
    allocation.amount.amount,
    allocation.consumedAmount.amount,
  );

  if (
    compareDecimals(
      execution.amount.amount,
      remainingAmount,
    ) > 0
  ) {
    throw new Error(
      `[TREASURY_EXECUTION_ALLOCATION_INSUFFICIENT_REMAINING_CAPITAL] ${execution.amount.amount} -> ${remainingAmount}`,
    );
  }
}
