import { addDecimals } from "../shared/decimalAmount";

import type { ProgramAccountId } from "../shared/identifiers";

import type { CurrencyCode } from "../shared/money";

import type { ProgramCapitalReceipt } from "./contracts";

import type { RecognizedCapitalPosition } from "./recognizedCapitalPosition";

import { PROGRAM_CAPITAL_RECEIPT_STATUS } from "./status";

export function deriveRecognizedCapitalPosition(params: {
  programAccountId: ProgramAccountId;

  currency: CurrencyCode;

  receipts: readonly ProgramCapitalReceipt[];
}): RecognizedCapitalPosition {
  const { programAccountId, currency, receipts } = params;

  let total = "0";

  const contributingReceiptIds: string[] = [];

  for (const receipt of receipts) {
    if (receipt.status !== PROGRAM_CAPITAL_RECEIPT_STATUS.RECOGNIZED) {
      throw new Error(
        `[RECOGNIZED_CAPITAL_POSITION_RECEIPT_NOT_RECOGNIZED] ${receipt.id}:${receipt.status}`,
      );
    }

    if (!receipt.recognizedAmount) {
      throw new Error(
        `[RECOGNIZED_CAPITAL_POSITION_RECOGNIZED_AMOUNT_REQUIRED] ${receipt.id}`,
      );
    }

    if (receipt.destinationProgramAccountId !== programAccountId) {
      throw new Error(
        `[RECOGNIZED_CAPITAL_POSITION_PROGRAM_ACCOUNT_MISMATCH] ${receipt.destinationProgramAccountId} -> ${programAccountId}`,
      );
    }

    if (receipt.recognizedAmount.currency !== currency) {
      throw new Error(
        `[RECOGNIZED_CAPITAL_POSITION_CURRENCY_MISMATCH] ${receipt.recognizedAmount.currency} -> ${currency}`,
      );
    }

    total = addDecimals(total, receipt.recognizedAmount.amount);

    contributingReceiptIds.push(receipt.id);
  }

  return {
    programAccountId,

    currency,

    recognizedAmount: {
      amount: total,

      currency,
    },

    contributingReceiptIds,
  };
}
