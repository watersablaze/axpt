import {
  compareDecimals,
  subtractDecimals,
} from "../shared/decimalAmount";

import type { ProgramAccountId } from "../shared/identifiers";

import type { CurrencyCode } from "../shared/money";

import type { CommittedCapitalPosition } from "../allocations/committedCapitalPosition";

import type { AvailableCapitalPosition } from "./availableCapitalPosition";

import type { GrossTreasuryPosition } from "./grossTreasuryPosition";

export function deriveAvailableCapitalPosition(params: {
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  grossPosition: GrossTreasuryPosition;

  committedPosition: CommittedCapitalPosition;
}): AvailableCapitalPosition {
  const {
    programAccountId,
    currency,
    grossPosition,
    committedPosition,
  } = params;

  if (grossPosition.programAccountId !== programAccountId) {
    throw new Error(
      `[AVAILABLE_CAPITAL_POSITION_GROSS_PROGRAM_ACCOUNT_MISMATCH] ${grossPosition.programAccountId} -> ${programAccountId}`,
    );
  }

  if (committedPosition.programAccountId !== programAccountId) {
    throw new Error(
      `[AVAILABLE_CAPITAL_POSITION_COMMITTED_PROGRAM_ACCOUNT_MISMATCH] ${committedPosition.programAccountId} -> ${programAccountId}`,
    );
  }

  if (
    grossPosition.currency !== currency ||
    grossPosition.grossAmount.currency !== currency
  ) {
    throw new Error(
      `[AVAILABLE_CAPITAL_POSITION_GROSS_CURRENCY_MISMATCH] ${grossPosition.currency}/${grossPosition.grossAmount.currency} -> ${currency}`,
    );
  }

  if (
    committedPosition.currency !== currency ||
    committedPosition.committedAmount.currency !== currency
  ) {
    throw new Error(
      `[AVAILABLE_CAPITAL_POSITION_COMMITTED_CURRENCY_MISMATCH] ${committedPosition.currency}/${committedPosition.committedAmount.currency} -> ${currency}`,
    );
  }

  if (
    compareDecimals(
      committedPosition.committedAmount.amount,
      grossPosition.grossAmount.amount,
    ) > 0
  ) {
    throw new Error(
      `[AVAILABLE_CAPITAL_POSITION_COMMITTED_EXCEEDS_GROSS] ${committedPosition.committedAmount.amount} > ${grossPosition.grossAmount.amount}`,
    );
  }

  const availableAmount = subtractDecimals(
    grossPosition.grossAmount.amount,
    committedPosition.committedAmount.amount,
  );

  return {
    programAccountId,

    currency,

    availableAmount: {
      amount: availableAmount,

      currency,
    },

    grossAmount: grossPosition.grossAmount,

    committedAmount: committedPosition.committedAmount,

    contributingReceiptIds:
      grossPosition.contributingReceiptIds,

    contributingExecutionIds:
      grossPosition.contributingExecutionIds,

    contributingAllocationIds:
      committedPosition.contributingAllocationIds,
  };
}
