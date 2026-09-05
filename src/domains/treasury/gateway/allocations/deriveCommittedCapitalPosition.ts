import {
  addDecimals,
  compareDecimals,
  subtractDecimals,
} from "../shared/decimalAmount";

import type { ProgramAccountId } from "../shared/identifiers";

import type { CurrencyCode } from "../shared/money";

import type { TreasuryAllocation } from "./contracts";

import type { CommittedCapitalPosition } from "./committedCapitalPosition";

import { TREASURY_ALLOCATION_STATUS } from "./status";

export function deriveCommittedCapitalPosition(params: {
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  allocations: readonly TreasuryAllocation[];
}): CommittedCapitalPosition {
  const { programAccountId, currency, allocations } = params;

  let total = "0";

  const contributingAllocationIds: string[] = [];

  for (const allocation of allocations) {
    if (
      allocation.status !== TREASURY_ALLOCATION_STATUS.ACTIVE &&
      allocation.status !== TREASURY_ALLOCATION_STATUS.PARTIALLY_CONSUMED
    ) {
      throw new Error(
        `[COMMITTED_CAPITAL_POSITION_ALLOCATION_NOT_EFFECTIVE] ${allocation.id}:${allocation.status}`,
      );
    }

    if (allocation.sourceProgramAccountId !== programAccountId) {
      throw new Error(
        `[COMMITTED_CAPITAL_POSITION_PROGRAM_ACCOUNT_MISMATCH] ${allocation.sourceProgramAccountId} -> ${programAccountId}`,
      );
    }

    if (
      allocation.amount.currency !== currency ||
      allocation.consumedAmount.currency !== currency
    ) {
      throw new Error(
        `[COMMITTED_CAPITAL_POSITION_CURRENCY_MISMATCH] ${allocation.amount.currency}/${allocation.consumedAmount.currency} -> ${currency}`,
      );
    }

    const remainingAmount = subtractDecimals(
      allocation.amount.amount,
      allocation.consumedAmount.amount,
    );

    if (compareDecimals(remainingAmount, "0") <= 0) {
      throw new Error(
        `[COMMITTED_CAPITAL_POSITION_REMAINING_AMOUNT_REQUIRED] ${allocation.id}`,
      );
    }

    total = addDecimals(total, remainingAmount);

    contributingAllocationIds.push(allocation.id);
  }

  return {
    programAccountId,

    currency,

    committedAmount: {
      amount: total,

      currency,
    },

    contributingAllocationIds,
  };
}
