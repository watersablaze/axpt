import {
  compareDecimals,
  subtractDecimals,
} from "../shared/decimalAmount";

import type { ProgramAccountId } from "../shared/identifiers";

import type { CurrencyCode } from "../shared/money";

import type { RecognizedCapitalPosition } from "../capital-receipts/recognizedCapitalPosition";

import type { ConfirmedOutboundCapitalPosition } from "../executions/confirmedOutboundCapitalPosition";

import type { GrossTreasuryPosition } from "./grossTreasuryPosition";

export function deriveGrossTreasuryPosition(params: {
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  recognizedPosition: RecognizedCapitalPosition;

  confirmedOutboundPosition: ConfirmedOutboundCapitalPosition;
}): GrossTreasuryPosition {
  const {
    programAccountId,
    currency,
    recognizedPosition,
    confirmedOutboundPosition,
  } = params;

  if (recognizedPosition.programAccountId !== programAccountId) {
    throw new Error(
      `[GROSS_TREASURY_POSITION_RECOGNIZED_PROGRAM_ACCOUNT_MISMATCH] ${recognizedPosition.programAccountId} -> ${programAccountId}`,
    );
  }

  if (confirmedOutboundPosition.programAccountId !== programAccountId) {
    throw new Error(
      `[GROSS_TREASURY_POSITION_OUTBOUND_PROGRAM_ACCOUNT_MISMATCH] ${confirmedOutboundPosition.programAccountId} -> ${programAccountId}`,
    );
  }

  if (
    recognizedPosition.currency !== currency ||
    recognizedPosition.recognizedAmount.currency !== currency
  ) {
    throw new Error(
      `[GROSS_TREASURY_POSITION_RECOGNIZED_CURRENCY_MISMATCH] ${recognizedPosition.currency}/${recognizedPosition.recognizedAmount.currency} -> ${currency}`,
    );
  }

  if (
    confirmedOutboundPosition.currency !== currency ||
    confirmedOutboundPosition.confirmedOutboundAmount.currency !== currency
  ) {
    throw new Error(
      `[GROSS_TREASURY_POSITION_OUTBOUND_CURRENCY_MISMATCH] ${confirmedOutboundPosition.currency}/${confirmedOutboundPosition.confirmedOutboundAmount.currency} -> ${currency}`,
    );
  }

  if (
    compareDecimals(
      confirmedOutboundPosition.confirmedOutboundAmount.amount,
      recognizedPosition.recognizedAmount.amount,
    ) > 0
  ) {
    throw new Error(
      `[GROSS_TREASURY_POSITION_OUTBOUND_EXCEEDS_RECOGNIZED] ${confirmedOutboundPosition.confirmedOutboundAmount.amount} > ${recognizedPosition.recognizedAmount.amount}`,
    );
  }

  const grossAmount = subtractDecimals(
    recognizedPosition.recognizedAmount.amount,
    confirmedOutboundPosition.confirmedOutboundAmount.amount,
  );

  return {
    programAccountId,

    currency,

    grossAmount: {
      amount: grossAmount,

      currency,
    },

    recognizedAmount: recognizedPosition.recognizedAmount,

    confirmedOutboundAmount:
      confirmedOutboundPosition.confirmedOutboundAmount,

    contributingReceiptIds:
      recognizedPosition.contributingReceiptIds,

    contributingExecutionIds:
      confirmedOutboundPosition.contributingExecutionIds,
  };
}
