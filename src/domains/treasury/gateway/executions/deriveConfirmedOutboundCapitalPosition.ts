import {
  addDecimals,
  assertPositiveDecimal,
} from "../shared/decimalAmount";

import type { ProgramAccountId } from "../shared/identifiers";

import type { CurrencyCode } from "../shared/money";

import type { TreasuryAllocation } from "../allocations/contracts";

import type { TreasuryExecution } from "./contracts";

import type { ConfirmedOutboundCapitalPosition } from "./confirmedOutboundCapitalPosition";

import { TREASURY_EXECUTION_STATUS } from "./status";

export type ConfirmedOutboundCapitalContribution = Readonly<{
  execution: TreasuryExecution;

  allocation: TreasuryAllocation;
}>;

export function deriveConfirmedOutboundCapitalPosition(params: {
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  contributions: readonly ConfirmedOutboundCapitalContribution[];
}): ConfirmedOutboundCapitalPosition {
  const { programAccountId, currency, contributions } = params;

  let confirmedOutboundAmount = "0";

  const contributingExecutionIds: string[] = [];

  const seenExecutionIds = new Set<string>();

  for (const { execution, allocation } of contributions) {
    if (seenExecutionIds.has(execution.id)) {
      throw new Error(
        `[CONFIRMED_OUTBOUND_CAPITAL_POSITION_DUPLICATE_EXECUTION] ${execution.id}`,
      );
    }

    seenExecutionIds.add(execution.id);

    if (execution.status !== TREASURY_EXECUTION_STATUS.CONFIRMED) {
      throw new Error(
        `[CONFIRMED_OUTBOUND_CAPITAL_POSITION_EXECUTION_NOT_CONFIRMED] ${execution.id}:${execution.status}`,
      );
    }

    if (execution.allocationId !== allocation.id) {
      throw new Error(
        `[CONFIRMED_OUTBOUND_CAPITAL_POSITION_ALLOCATION_MISMATCH] ${execution.id}:${execution.allocationId} -> ${allocation.id}`,
      );
    }

    if (execution.programId !== allocation.programId) {
      throw new Error(
        `[CONFIRMED_OUTBOUND_CAPITAL_POSITION_PROGRAM_MISMATCH] ${execution.id}:${execution.programId} -> ${allocation.programId}`,
      );
    }

    if (allocation.sourceProgramAccountId !== programAccountId) {
      throw new Error(
        `[CONFIRMED_OUTBOUND_CAPITAL_POSITION_PROGRAM_ACCOUNT_MISMATCH] ${allocation.id}:${allocation.sourceProgramAccountId} -> ${programAccountId}`,
      );
    }

    if (execution.amount.currency !== currency) {
      throw new Error(
        `[CONFIRMED_OUTBOUND_CAPITAL_POSITION_CURRENCY_MISMATCH] ${execution.id}:${execution.amount.currency} -> ${currency}`,
      );
    }

    if (allocation.amount.currency !== execution.amount.currency) {
      throw new Error(
        `[CONFIRMED_OUTBOUND_CAPITAL_POSITION_ALLOCATION_CURRENCY_MISMATCH] ${execution.id}:${execution.amount.currency} -> ${allocation.amount.currency}`,
      );
    }

    assertPositiveDecimal(execution.amount.amount);

    confirmedOutboundAmount = addDecimals(
      confirmedOutboundAmount,
      execution.amount.amount,
    );

    contributingExecutionIds.push(execution.id);
  }

  return {
    programAccountId,

    currency,

    confirmedOutboundAmount: {
      amount: confirmedOutboundAmount,

      currency,
    },

    contributingExecutionIds,
  };
}
