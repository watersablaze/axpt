import {
  TRANSFER_CAPACITY_CONSTRAINT_STATUS,
  type TransferCapacityConstraint,
} from "./contracts";

import { compareDecimals } from "../shared/decimalAmount";

import type { TreasuryMoney } from "../shared/money";

export function computeExecutableTransferCapacity(params: {
  requestedAmount: TreasuryMoney;

  constraints: readonly TransferCapacityConstraint[];
}): TreasuryMoney | undefined {
  const { requestedAmount, constraints } = params;

  const undetermined = constraints.some(
    (constraint) =>
      constraint.status === TRANSFER_CAPACITY_CONSTRAINT_STATUS.UNDETERMINED,
  );

  if (undetermined) {
    return undefined;
  }

  let minimumAmount = requestedAmount.amount;

  for (const constraint of constraints) {
    if (
      constraint.status === TRANSFER_CAPACITY_CONSTRAINT_STATUS.NOT_REQUIRED
    ) {
      continue;
    }

    if (!constraint.limit) {
      throw new Error(
        `[TRANSFER_CAPACITY_APPLICABLE_LIMIT_REQUIRED] ${constraint.type}`,
      );
    }

    if (constraint.limit.currency !== requestedAmount.currency) {
      throw new Error(
        `[TRANSFER_CAPACITY_CURRENCY_MISMATCH] ${constraint.limit.currency} -> ${requestedAmount.currency}`,
      );
    }

    if (compareDecimals(constraint.limit.amount, minimumAmount) < 0) {
      minimumAmount = constraint.limit.amount;
    }
  }

  return {
    amount: minimumAmount,

    currency: requestedAmount.currency,
  };
}
