import { compareDecimals } from "../shared/decimalAmount";

import type { TreasuryExecution } from "./contracts";

import type { VerifiedTreasuryExecutionSettlement } from "./verifiedSettlementContracts";

export function assertVerifiedTreasuryExecutionSettlementMatchesExecution(params: {
  settlement: VerifiedTreasuryExecutionSettlement;

  execution: TreasuryExecution;
}): void {
  const { settlement, execution } = params;

  if (settlement.executionId !== execution.id) {
    throw new Error(
      `[TREASURY_EXECUTION_VERIFIED_SETTLEMENT_EXECUTION_MISMATCH] ${settlement.executionId} -> ${execution.id}`,
    );
  }

  if (settlement.amount.currency.trim().length === 0) {
    throw new Error(
      "[TREASURY_EXECUTION_VERIFIED_SETTLEMENT_CURRENCY_REQUIRED]",
    );
  }

  if (settlement.amount.amount.trim().length === 0) {
    throw new Error(
      "[TREASURY_EXECUTION_VERIFIED_SETTLEMENT_AMOUNT_REQUIRED]",
    );
  }

  if (Number.isNaN(settlement.verifiedAt.getTime())) {
    throw new Error(
      "[TREASURY_EXECUTION_VERIFIED_SETTLEMENT_VERIFIED_AT_INVALID]",
    );
  }

  /*
   * Treasury already governs the intended value of the Execution.
   *
   * The rail is a witness to external reality, not an authority capable
   * of changing the governed financial instruction.
   */
  if (settlement.amount.currency !== execution.amount.currency) {
    throw new Error(
      `[TREASURY_EXECUTION_VERIFIED_SETTLEMENT_CURRENCY_MISMATCH] ${settlement.amount.currency} -> ${execution.amount.currency}`,
    );
  }

  /*
   * Decimal strings are representations, not financial identity.
   *
   * "25.5" and "25.50" represent the same Treasury amount and therefore
   * must compare numerically rather than by raw string equality.
   */
  if (
    compareDecimals(
      settlement.amount.amount,
      execution.amount.amount,
    ) !== 0
  ) {
    throw new Error(
      `[TREASURY_EXECUTION_VERIFIED_SETTLEMENT_AMOUNT_MISMATCH] ${settlement.amount.amount} -> ${execution.amount.amount}`,
    );
  }
}
